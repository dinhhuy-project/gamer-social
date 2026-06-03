import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createNotifications } from "@/lib/services";
import { Prisma } from "@/generated/prisma/client";
import { AppError } from "./shared/app-error";
import { assertAuth, assertExists } from "./shared/assert";

export type FollowStatusDTO = {
  actorId: string;
  targetId: string;
  following: boolean;
  followerCount: number;
  followingCount: number;
};

export async function isFollowing(actorId: string | null | undefined, targetId: string | null | undefined): Promise<boolean> {
  if (!actorId || !targetId) return false;

  const rec = await prisma.follows.findUnique({
    where: { follower_id_following_id: { follower_id: actorId, following_id: targetId } },
    select: { follower_id: true },
  });

  return !!rec;
}

export async function getFollowerCount(userId: string | null | undefined): Promise<number> {
  if (!userId) return 0;
  return prisma.follows.count({ where: { following_id: userId } });
}

export async function getFollowingCount(userId: string | null | undefined): Promise<number> {
  if (!userId) return 0;
  return prisma.follows.count({ where: { follower_id: userId } });
}

export async function followUser(actorId: string, targetId: string | null | undefined): Promise<FollowStatusDTO> {
  // Permission check: caller must be authenticated
  assertAuth(actorId);
  if (!targetId) throw new AppError("Target user id is required", 400, "INVALID_INPUT");

  if (actorId === targetId) throw new AppError("Cannot follow yourself", 400, "SELF_FOLLOW");

  // Ensure target exists
  const target = await prisma.users.findUnique({ where: { id: targetId } });
  assertExists(target, "Target user not found");

  // Fast-path: already following
  const existing = await prisma.follows.findUnique({
    where: { follower_id_following_id: { follower_id: actorId!, following_id: targetId } },
  });

  if (existing) {
    const [followerCount, followingCount] = await prisma.$transaction([
      prisma.follows.count({ where: { following_id: targetId } }),
      prisma.follows.count({ where: { follower_id: actorId! } }),
    ]);

    return {
      actorId: actorId!,
      targetId,
      following: true,
      followerCount,
      followingCount,
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.follows.create({ data: { follower_id: actorId!, following_id: targetId } });

      // create an in-app notification for the followed user (best-effort)
      try {
        await createNotifications(tx, [
          {
            userId: targetId,
            type: "new_follower",
            title: null,
            body: null,
            data: { followerId: actorId },
          },
        ], { actorId });
      } catch (e) {
        // ignore notification failures so follow still succeeds
      }

      const followerCount = await tx.follows.count({ where: { following_id: targetId } });
      const followingCount = await tx.follows.count({ where: { follower_id: actorId! } });

      return { followerCount, followingCount };
    });

    // best-effort: emit or sync via Supabase Admin (non-blocking)
    try {
      // Example placeholder: could call admin APIs or server-side realtime here.
      // supabaseAdmin.rpc(...) or supabaseAdmin.from(...).insert(...)
      void supabaseAdmin; // keep reference to avoid unused-import lint in some setups
    } catch (e) {
      // ignore supabase admin failures
    }

    return {
      actorId: actorId!,
      targetId,
      following: true,
      followerCount: result.followerCount,
      followingCount: result.followingCount,
    };
  } catch (err: any) {
    // handle unique-constraint race condition: consider as already-following
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const [followerCount, followingCount] = await prisma.$transaction([
        prisma.follows.count({ where: { following_id: targetId } }),
        prisma.follows.count({ where: { follower_id: actorId! } }),
      ]);

      return {
        actorId: actorId!,
        targetId,
        following: true,
        followerCount,
        followingCount,
      };
    }

    throw err;
  }
}

export async function unfollowUser(actorId: string, targetId: string | null | undefined): Promise<FollowStatusDTO> {
  assertAuth(actorId);
  if (!targetId) throw new AppError("Target user id is required", 400, "INVALID_INPUT");
  if (actorId === targetId) throw new AppError("Cannot unfollow yourself", 400, "SELF_UNFOLLOW");

  const target = await prisma.users.findUnique({ where: { id: targetId } });
  assertExists(target, "Target user not found");

  const existing = await prisma.follows.findUnique({
    where: { follower_id_following_id: { follower_id: actorId!, following_id: targetId } },
  });

  if (!existing) {
    const [followerCount, followingCount] = await prisma.$transaction([
      prisma.follows.count({ where: { following_id: targetId } }),
      prisma.follows.count({ where: { follower_id: actorId! } }),
    ]);

    return {
      actorId: actorId!,
      targetId,
      following: false,
      followerCount,
      followingCount,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.follows.delete({ where: { follower_id_following_id: { follower_id: actorId!, following_id: targetId } } });
    // optionally create an audit record or remove a notification — omitted
  });

  const [followerCount, followingCount] = await prisma.$transaction([
    prisma.follows.count({ where: { following_id: targetId } }),
    prisma.follows.count({ where: { follower_id: actorId! } }),
  ]);

  return {
    actorId: actorId!,
    targetId,
    following: false,
    followerCount,
    followingCount,
  };
}

export const followService = {
  isFollowing,
  getFollowerCount,
  getFollowingCount,
  followUser,
  unfollowUser,
};

