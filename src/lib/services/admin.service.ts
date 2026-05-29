import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";

import type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUsersResponse,
  UserRole,
} from "@/types/api.types";

const ADMIN_USER_SELECT = {
  id: true,
  username: true,
  display_name: true,
  email: true,
  avatar_url: true,
  role: true,
  is_active: true,
  email_verified: true,
  created_at: true,
  last_seen_at: true,
  _count: {
    select: {
      posts_posts_user_idTousers: true,
    },
  },
} satisfies Prisma.usersSelect;

const ADMIN_USER_DETAIL_SELECT = {
  ...ADMIN_USER_SELECT,
  cover_url: true,
  bio: true,
  _count: {
    select: {
      posts_posts_user_idTousers: true,
      follows_follows_following_idTousers: true,
      follows_follows_follower_idTousers: true,
    },
  },
} satisfies Prisma.usersSelect;

export type GetUsersInput = {
  search?: string;
  role?: "all" | UserRole;
  isActive?: boolean;
  verified?: boolean;
  page?: number;
  limit?: number;
};

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function mapListUser(user: Prisma.usersGetPayload<{ select: typeof ADMIN_USER_SELECT }>): AdminUserListItem {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    email: user.email,
    avatarUrl: user.avatar_url,
    role: user.role,
    isActive: user.is_active,
    emailVerified: user.email_verified,
    postsCount: user._count.posts_posts_user_idTousers,
    createdAt: user.created_at.toISOString(),
    lastSeenAt: toIso(user.last_seen_at),
  };
}

export async function getUsers(input: GetUsersInput = {}): Promise<AdminUsersResponse> {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));
  const search = input.search?.trim();

  const where: Prisma.usersWhereInput = {
    ...(input.role && input.role !== "all" ? { role: input.role } : {}),
    ...(typeof input.isActive === "boolean" ? { is_active: input.isActive } : {}),
    ...(typeof input.verified === "boolean" ? { email_verified: input.verified } : {}),
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { display_name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, total] = await prisma.$transaction([
    prisma.users.findMany({
      where,
      select: ADMIN_USER_SELECT,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.users.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    users: users.map(mapListUser),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getUserDetail(id: string): Promise<AdminUserDetail> {
  const user = await prisma.users.findUnique({
    where: { id },
    select: ADMIN_USER_DETAIL_SELECT,
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const marketplaceListingsCount = await prisma.posts.count({
    where: {
      user_id: id,
      post_type: "marketplace",
    },
  });

  return {
    ...mapListUser(user),
    coverUrl: user.cover_url,
    bio: user.bio,
    followersCount: user._count.follows_follows_following_idTousers,
    followingCount: user._count.follows_follows_follower_idTousers,
    marketplaceListingsCount,
  };
}

export async function updateUserStatus(actorId: string, userId: string, isActive: boolean) {
  if (actorId === userId && !isActive) {
    throw new AppError("Admin cannot deactivate their own account", 400, "SELF_DEACTIVATE_DENIED");
  }

  const updated = await prisma.users.update({
    where: { id: userId },
    data: { is_active: isActive },
    select: ADMIN_USER_SELECT,
  });

  return mapListUser(updated);
}

export async function updateUserRole(userId: string, role: Exclude<UserRole, "admin">) {
  const target = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!target) {
    throw new NotFoundError("User not found");
  }

  if (target.role === "admin") {
    throw new AppError("Admin role cannot be changed", 400, "ADMIN_ROLE_LOCKED");
  }

  const updated = await prisma.users.update({
    where: { id: userId },
    data: { role },
    select: ADMIN_USER_SELECT,
  });

  return mapListUser(updated);
}

export const adminService = {
  getUsers,
  getUserDetail,
  updateUserStatus,
  updateUserRole,
};
