
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assertAuth, assertExists, assertRole } from "./shared/assert";
import type { PublicUser, CurrentUser, PaginatedResponse } from "@/types/api.types";

export type UpdateProfileInput = {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
};

export type UserProfileDTO = PublicUser & {
  bio: string | null;
  coverUrl: string | null;
  isFollowing?: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
};

function toPublicUser(u: any): PublicUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name ?? null,
    avatarUrl: u.avatar_url ?? null,
    role: u.role,
  };
}

function toCurrentUser(u: any): CurrentUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name ?? null,
    avatarUrl: u.avatar_url ?? null,
    role: u.role,
    email: u.email,
    coverUrl: u.cover_url ?? null,
    bio: u.bio ?? null,
    isActive: u.is_active,
    createdAt: u.created_at,
  } as unknown as CurrentUser;
}

/**
 * Lấy profile public theo `username` hoặc `display_name`.
 * Ưu tiên khớp `username` trước; nếu không tìm thấy sẽ khớp `display_name`.
 * Trả về thông tin chuẩn hoá + counts. Nếu truyền `viewerId` sẽ trả `isFollowing`.
 */
export async function getPublicProfileByUsernameOrDisplayName(
  identifier: string,
  viewerId?: string | null
) {
  // ưu tiên tìm theo username (unique), fallback sang display_name
  let user = await prisma.users.findUnique({ where: { username: identifier } });
  if (!user) {
    user = await prisma.users.findFirst({ where: { display_name: identifier } });
  }

  const userExists = assertExists(user, "User not found");

  const [followersCount, followingCount, postsCount, isFollowingCount] = await prisma.$transaction(
    async (tx) => {
      const followersCount = await tx.follows.count({ where: { following_id: userExists.id } });
      const followingCount = await tx.follows.count({ where: { follower_id: userExists.id } });
      const postsCount = await tx.posts.count({ where: { user_id: userExists.id, status: "active" } });
      const isFollowingCount = viewerId
        ? await tx.follows.count({ where: { follower_id: viewerId, following_id: userExists.id } })
        : 0;

      return [followersCount, followingCount, postsCount, isFollowingCount] as const;
    }
  );

  const publicUser = toPublicUser(userExists);

  return {
    ...publicUser,
    bio: userExists.bio ?? null,
    coverUrl: userExists.cover_url ?? null,
    isFollowing: !!isFollowingCount,
    followersCount,
    followingCount,
    postsCount,
  } as UserProfileDTO;
}

/**
 * Lấy current user (internal id)
 */
export async function getCurrentUserById(id: string) {
  if (!id) return null;
  const u = await prisma.users.findUnique({ where: { id } });
  if (!u) return null;
  return toCurrentUser(u);
}

/**
 * Cập nhật profile. Caller phải truyền `actorId` (người thực hiện).
 * - Nếu actor !== target thì actor phải là `admin`.
 * - Trả về bản DTO chuẩn hoá.
 */
export async function updateProfile(actorId: string, targetUserId: string, input: UpdateProfileInput) {
  assertAuth(actorId);

  const actor = assertExists(
    await prisma.users.findUnique({ where: { id: actorId } }),
    "Actor not found"
  );

  if (actorId !== targetUserId) {
    // only admin can update other profiles
    assertRole(actor.role, ["admin"]);
  }

  // use transaction to update and read back in one atomic operation
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.users.update({
      where: { id: targetUserId },
      data: {
        display_name: input.display_name ?? undefined,
        bio: input.bio ?? undefined,
        avatar_url: input.avatar_url ?? undefined,
        cover_url: input.cover_url ?? undefined,
        updated_at: new Date(),
      },
    });

    return u;
  });

  return toCurrentUser(updated);
}

/**
 * Xóa account hoàn toàn (admin hoặc chính user).
 * Thực hiện xóa trong transaction rồi cố gắng xóa Supabase auth record (nếu có).
 */
export async function deleteAccount(actorId: string, targetUserId: string) {
  assertAuth(actorId);

  if (actorId !== targetUserId) {
    const actor = assertExists(
      await prisma.users.findUnique({ where: { id: actorId } }),
      "Actor not found"
    );
    assertRole(actor.role, ["admin"]);
  }

  const existing = assertExists(
    await prisma.users.findUnique({ where: { id: targetUserId } }),
    "User not found"
  );

  // Delete user (most relations are cascade) inside transaction for safety
  const deleted = await prisma.$transaction(async (tx) => {
    // If you need to run extra cleanup before removing the user, do it here.
    // Rely on DB cascade rules where appropriate.
    const u = await tx.users.delete({ where: { id: targetUserId } });
    return u;
  });

  // try to delete Supabase auth user (best-effort)
  if (existing.auth_id) {
    try {
      // admin.deleteUser may not exist on all client versions; call best-effort and ignore errors
      const adminApi = (supabaseAdmin.auth as any).admin;
      if (adminApi && typeof adminApi.deleteUserById === "function") {
        await adminApi.deleteUserById(existing.auth_id);
      } else if (adminApi && typeof adminApi.deleteUser === "function") {
        await adminApi.deleteUser(existing.auth_id);
      } else if (typeof (supabaseAdmin.auth as any).admin?.getUserById === "function") {
        // no-op fallback to avoid TypeScript complaints
      }
    } catch {
      // ignore Supabase cleanup failures
    }
  }

  return { id: deleted.id };
}

/**
 * Danh sách người dùng public (pagination + optional search).
 */
export async function listUsers(page = 1, perPage = 20, q?: string) {
  const take = Math.max(1, Math.min(100, perPage));
  const skip = Math.max(0, (page - 1) * take);

  const where: any = { is_active: true };
  if (q) {
    where.OR = [
      { username: { contains: q } },
      { display_name: { contains: q } },
    ];
  }

  const [total, users] = await prisma.$transaction([
    prisma.users.count({ where }),
    prisma.users.findMany({ where, skip, take, orderBy: { created_at: "desc" } }),
  ]);

  const data = users.map((u) => toPublicUser(u));

  const totalPages = Math.ceil(total / take) || 1;

  return {
    data,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  } as PaginatedResponse<PublicUser>;
}

export const userService = {
  getPublicProfileByUsernameOrDisplayName,
  getCurrentUserById,
  updateProfile,
  deleteAccount,
  listUsers,
};

export default userService;

