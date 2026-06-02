import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/lib/services";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";

import type {
  AdminPostDetail,
  AdminPostListItem,
  AdminPostsResponse,
  AdminUserDetail,
  AdminUserListItem,
  AdminUsersResponse,
  ListingStatus,
  PostStatus,
  PostType,
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

const ADMIN_POST_SELECT = {
  id: true,
  user_id: true,
  content: true,
  media_urls: true,
  post_type: true,
  status: true,
  view_count: true,
  listing_price: true,
  game_name: true,
  listing_status: true,
  listing_reviewed_by: true,
  listing_reviewed_at: true,
  reject_reason: true,
  created_at: true,
  updated_at: true,
  users_posts_user_idTousers: {
    select: {
      id: true,
      username: true,
      display_name: true,
      avatar_url: true,
      role: true,
    },
  },
  post_tags: {
    select: {
      tags: {
        select: {
          name: true,
        },
      },
    },
  },
  _count: {
    select: {
      comments: true,
    },
  },
} satisfies Prisma.postsSelect;

export type GetUsersInput = {
  search?: string;
  role?: "all" | UserRole;
  isActive?: boolean;
  verified?: boolean;
  page?: number;
  limit?: number;
};

export type GetPostsInput = {
  search?: string;
  postType?: "all" | PostType;
  status?: "all" | PostStatus;
  listingStatus?: "all" | ListingStatus;
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

function getMediaUrls(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function getContentPreview(content: string | null) {
  if (!content) return null;
  return content.length > 140 ? `${content.slice(0, 140)}...` : content;
}

function mapPost(
  post: Prisma.postsGetPayload<{ select: typeof ADMIN_POST_SELECT }>,
  reactionsCount = 0,
  reactionsSummary: Record<string, number> = {}
): AdminPostListItem | AdminPostDetail {
  const mediaUrls = getMediaUrls(post.media_urls);

  const base: AdminPostListItem = {
    id: post.id,
    author: {
      id: post.users_posts_user_idTousers.id,
      username: post.users_posts_user_idTousers.username,
      displayName: post.users_posts_user_idTousers.display_name,
      avatarUrl: post.users_posts_user_idTousers.avatar_url,
      role: post.users_posts_user_idTousers.role,
    },
    contentPreview: getContentPreview(post.content),
    mediaCount: mediaUrls.length,
    mediaUrls,
    tags: post.post_tags.map((item) => item.tags.name),
    postType: post.post_type,
    status: post.status,
    listingStatus: post.listing_status,
    gameName: post.game_name,
    listingPrice: post.listing_price ? Number(post.listing_price) : null,
    createdAt: post.created_at.toISOString(),
    reactionsCount,
    commentsCount: post._count.comments,
  };

  return {
    ...base,
    content: post.content,
    viewCount: post.view_count,
    listingReviewedBy: post.listing_reviewed_by,
    listingReviewedAt: toIso(post.listing_reviewed_at),
    rejectReason: post.reject_reason,
    reactionsSummary,
  };
}

async function getReactionCounts(postIds: string[]) {
  if (!postIds.length) return new Map<string, number>();

  const rows = await prisma.reactions.groupBy({
    by: ["target_id"],
    where: {
      target_type: "post",
      target_id: { in: postIds },
    },
    _count: { _all: true },
  });

  return new Map(rows.map((row) => [row.target_id, row._count._all]));
}

async function getReactionSummary(postId: string) {
  const rows = await prisma.reactions.groupBy({
    by: ["type"],
    where: {
      target_type: "post",
      target_id: postId,
    },
    _count: { _all: true },
  });

  return Object.fromEntries(rows.map((row) => [row.type, row._count._all]));
}

function buildPostsWhere(input: GetPostsInput, forceMarketplace = false): Prisma.postsWhereInput {
  const search = input.search?.trim();

  return {
    ...(forceMarketplace ? { post_type: "marketplace" as const } : {}),
    ...(!forceMarketplace && input.postType && input.postType !== "all"
      ? { post_type: input.postType }
      : {}),
    ...(input.status && input.status !== "all" ? { status: input.status } : {}),
    ...(input.listingStatus && input.listingStatus !== "all"
      ? { listing_status: input.listingStatus }
      : {}),
    ...(search
      ? {
        OR: [
          { content: { contains: search, mode: "insensitive" } },
          { game_name: { contains: search, mode: "insensitive" } },
          {
            users_posts_user_idTousers: {
              username: { contains: search, mode: "insensitive" },
            },
          },
        ],
      }
      : {}),
  };
}

async function getPostList(input: GetPostsInput = {}, forceMarketplace = false): Promise<AdminPostsResponse> {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));
  const where = buildPostsWhere(input, forceMarketplace);

  const [posts, total] = await prisma.$transaction([
    prisma.posts.findMany({
      where,
      select: ADMIN_POST_SELECT,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.posts.count({ where }),
  ]);

  const reactionCounts = await getReactionCounts(posts.map((post) => post.id));
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    posts: posts.map((post) => mapPost(post, reactionCounts.get(post.id) ?? 0) as AdminPostListItem),
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

export async function getPosts(input: GetPostsInput = {}) {
  return getPostList(input, false);
}

export async function getMarketplaceListings(input: GetPostsInput = {}) {
  return getPostList(input, true);
}

export async function getPostDetail(id: string): Promise<AdminPostDetail> {
  const post = await prisma.posts.findUnique({
    where: { id },
    select: ADMIN_POST_SELECT,
  });

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  const [reactionCounts, reactionsSummary] = await Promise.all([
    getReactionCounts([id]),
    getReactionSummary(id),
  ]);

  return mapPost(post, reactionCounts.get(id) ?? 0, reactionsSummary) as AdminPostDetail;
}

export async function updatePostStatus(postId: string, status: PostStatus) {
  const updated = await prisma.posts.update({
    where: { id: postId },
    data: {
      status,
      updated_at: new Date(),
    },
    select: ADMIN_POST_SELECT,
  });

  const reactionCounts = await getReactionCounts([postId]);
  return mapPost(updated, reactionCounts.get(postId) ?? 0) as AdminPostDetail;
}

export async function reviewMarketplaceListing(input: {
  adminId: string;
  postId: string;
  action: "approve" | "reject";
  rejectReason?: string | null;
}) {
  const existing = await prisma.posts.findUnique({
    where: { id: input.postId },
    select: {
      id: true,
      user_id: true,
      post_type: true,
    },
  });

  if (!existing) {
    throw new NotFoundError("Post not found");
  }

  if (existing.post_type !== "marketplace") {
    throw new AppError("Post is not a marketplace listing", 400, "INVALID_LISTING");
  }

  if (input.action === "reject" && !input.rejectReason?.trim()) {
    throw new AppError("Reject reason is required", 400, "REJECT_REASON_REQUIRED");
  }

  await prisma.$transaction(async (tx) => {
    await tx.posts.update({
      where: { id: input.postId },
      data: {
        listing_status: input.action === "approve" ? "approved" : "rejected",
        listing_reviewed_by: input.adminId,
        listing_reviewed_at: new Date(),
        reject_reason: input.action === "approve" ? null : input.rejectReason?.trim(),
        updated_at: new Date(),
      },
    });

    await notificationService.createNotifications(tx, [
      {
        userId: existing.user_id,
        type: "listing_reviewed",
        title: input.action === "approve" ? "Your listing has been approved" : "Your listing has been rejected",
        body: input.action === "reject" ? `Reason: ${input.rejectReason?.trim()}` : null,
        data: { postId: existing.id, action: input.action },
      },
    ], { actorId: input.adminId });
  });

  return getPostDetail(input.postId);
}

export const adminService = {
  getUsers,
  getUserDetail,
  updateUserStatus,
  updateUserRole,
  getPosts,
  getPostDetail,
  updatePostStatus,
  getMarketplaceListings,
  reviewMarketplaceListing,
};
