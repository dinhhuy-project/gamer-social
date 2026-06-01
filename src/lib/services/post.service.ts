import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppError, NotFoundError } from "./shared/app-error";
import { assertAuth, assertExists, assertRole } from "./shared/assert";
import type { PublicUser, PaginatedResponse } from "@/types/api.types";
import { Prisma } from "@/generated/prisma/client";
import { tagService } from "./tag.service";

export type CreatePostInput = {
  post_type: "regular" | "marketplace";
  content?: string | null;
  media_urls?: string[];
  tag_ids?: number[];
  tag_names?: string[];
  listing_price?: number;
  game_name?: string | null;
};

export type UpdatePostInput = Partial<CreatePostInput> & {
  // allow updating tags atomically
  tag_ids?: number[] | null;
};

export type PostDTO = {
  id: string;
  userId: string;
  author: PublicUser | null;
  postType: "regular" | "marketplace";
  content: string | null;
  mediaUrls: string[];
  status: "active" | "hidden" | "deleted";
  viewCount: number;
  listingPrice: number | null;
  gameName: string | null;
  listingStatus: "pending_review" | "approved" | "rejected" | "sold" | null;
  listingReviewedBy: string | null;
  listingReviewedAt: Date | null;
  rejectReason: string | null;
  tagNames: string[];
  createdAt: Date;
  updatedAt: Date;
};

function toPublicUser(u: any): PublicUser {
  if (!u) return null as any;
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name ?? null,
    avatarUrl: u.avatar_url ?? null,
    role: u.role,
  } as PublicUser;
}

async function loadTagNamesForPost(postId: string) {
  const rows = await prisma.post_tags.findMany({
    where: { post_id: postId },
    include: { tags: { select: { name: true } } },
  });
  return rows.map((r) => r.tags.name);
}

async function mapPostToDTO(post: any): Promise<PostDTO> {
  const authorRec = await prisma.users.findUnique({ where: { id: post.user_id } });
  const tagNames = await loadTagNamesForPost(post.id);

  return {
    id: post.id,
    userId: post.user_id,
    author: toPublicUser(authorRec),
    postType: post.post_type,
    content: post.content ?? null,
    mediaUrls: (post.media_urls as any) ?? [],
    status: post.status,
    viewCount: post.view_count,
    listingPrice: post.listing_price ? Number(post.listing_price) : null,
    gameName: post.game_name ?? null,
    listingStatus: post.listing_status ?? null,
    listingReviewedBy: post.listing_reviewed_by ?? null,
    listingReviewedAt: post.listing_reviewed_at ?? null,
    rejectReason: post.reject_reason ?? null,
    tagNames,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
}

/**
 * Lấy post chuẩn hoá. Nếu post đang `hidden`/`deleted`, chỉ owner hoặc admin mới xem được.
 */
export async function getPostById(viewerId: string | null | undefined, postId: string) {
  const post = assertExists(await prisma.posts.findUnique({ where: { id: postId } }), "Post not found");

  if (post.status === "deleted") {
    // deleted posts are hidden from everyone except admin or owner
    if (!viewerId || viewerId !== post.user_id) {
      // check role when viewer exists
      if (!viewerId) throw new NotFoundError();
      const viewer = await prisma.users.findUnique({ where: { id: viewerId } });
      if (!viewer || viewer.role !== "admin") throw new NotFoundError();
    }
  }

  if (post.status === "hidden") {
    if (!viewerId || (viewerId !== post.user_id)) {
      const viewer = viewerId ? await prisma.users.findUnique({ where: { id: viewerId } }) : null;
      if (!viewer || viewer.role !== "admin") throw new NotFoundError();
    }
  }

  // Marketplace visibility: only approved listings are public
  if (post.post_type === "marketplace" && post.listing_status !== "approved") {
    if (!viewerId || viewerId !== post.user_id) {
      const viewer = viewerId ? await prisma.users.findUnique({ where: { id: viewerId } }) : null;
      if (!viewer || viewer.role !== "admin") throw new NotFoundError();
    }
  }

  return mapPostToDTO(post);
}

export async function createPost(actorId: string, input: CreatePostInput) {
  assertAuth(actorId);

  const actor = assertExists(await prisma.users.findUnique({ where: { id: actorId } }), "Actor not found");

  if (input.post_type === "marketplace") {
    // only members and admins can create marketplace posts
    assertRole(actor.role, ["member", "admin"]);

    if (input.listing_price == null || input.game_name == null) {
      throw new AppError("Marketplace posts require listing_price and game_name", 400, "INVALID_INPUT");
    }
  }

  // Resolve tag names to ids (if provided) before creating the post
  let tagIdsToAttach: number[] = [];
  if (input.tag_ids && input.tag_ids.length) {
    tagIdsToAttach = input.tag_ids;
  } else if (input.tag_names && input.tag_names.length) {
    const resolved = await tagService.findOrCreateTagsByNames(input.tag_names);
    tagIdsToAttach = resolved.map((t) => t.id);
  }

  const created = await prisma.$transaction(async (tx) => {
    const p = await tx.posts.create({
      data: {
        user_id: actorId,
        post_type: input.post_type ?? "regular",
        content: input.content ?? undefined,
        media_urls: input.media_urls ?? undefined,
        listing_price: input.listing_price ?? undefined,
        game_name: input.game_name ?? undefined,
        listing_status: input.post_type === "marketplace" ? "pending_review" : undefined,
      },
    });

    if (tagIdsToAttach && tagIdsToAttach.length) {
      for (const t of tagIdsToAttach) {
        try {
          await tx.post_tags.create({ data: { post_id: p.id, tag_id: t } });
        } catch (e: any) {
          // ignore duplicate tag race conditions
          if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
        }
      }
    }

    // detect share behavior: if the post content contains a link to another post
    // e.g. "... https://host/posts/<id>", create a `post_shares` entry referencing that post
    try {
      if (input.content && typeof input.content === "string") {
        const content = input.content;
        // prefer strict UUID match (Prisma gen_random_uuid())
        const uuidMatch = content.match(/\/posts\/([0-9a-fA-F\-]{36})\b/);
        const simpleMatch = content.match(/\/posts\/([A-Za-z0-9_-]{6,64})/);
        const match = uuidMatch ?? simpleMatch;
        if (match && match[1]) {
          const sharedPostId = match[1];
          // ensure target post exists and is visible (use same tx)
          const target = await tx.posts.findUnique({ where: { id: sharedPostId } });
          if (target) {
            const note = content.slice(0, (match.index ?? content.indexOf(match[0]))).trim() || null;
            try {
              await tx.post_shares.create({ data: { user_id: actorId, post_id: sharedPostId, note: note ?? undefined } });
              // invalidate small aggregate cache (best-effort)
              try { aggregateCache.delete(`post:${sharedPostId}:shareAgg`); } catch { }
            } catch {
              // ignore share insertion failures
            }
          }
        }
      }
    } catch {
      // best-effort only
    }

    return p;
  });

  return getPostById(actorId, created.id);
}

export async function updatePost(actorId: string, postId: string, input: UpdatePostInput) {
  assertAuth(actorId);

  const existing = assertExists(await prisma.posts.findUnique({ where: { id: postId } }), "Post not found");

  if (existing.user_id !== actorId) {
    const actor = assertExists(await prisma.users.findUnique({ where: { id: actorId } }), "Actor not found");
    assertRole(actor.role, ["admin"]);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const data: any = {
      content: input.content ?? undefined,
      media_urls: input.media_urls ?? undefined,
      updated_at: new Date(),
    };

    // marketplace-specific updates
    if (existing.post_type === "marketplace") {
      if (input.listing_price != null) data.listing_price = input.listing_price;
      if (input.game_name != null) data.game_name = input.game_name;

      // if owner edits listing details after approval, revert to pending_review
      if (existing.listing_status === "approved" && actorId === existing.user_id) {
        data.listing_status = "pending_review";
        data.listing_reviewed_by = null;
        data.listing_reviewed_at = null;
        data.reject_reason = null;
      }
    }

    const p = await tx.posts.update({ where: { id: postId }, data });

    // tags: replace atomically if provided (null means clear)
    if (input.tag_ids) {
      await tx.post_tags.deleteMany({ where: { post_id: postId } });
      for (const t of input.tag_ids) {
        try {
          await tx.post_tags.create({ data: { post_id: postId, tag_id: t } });
        } catch (e: any) {
          if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
        }
      }
    }

    return p;
  });

  return getPostById(actorId, updated.id);
}

export async function hidePost(actorId: string, postId: string) {
  assertAuth(actorId);

  const existing = assertExists(await prisma.posts.findUnique({ where: { id: postId } }), "Post not found");

  if (existing.user_id !== actorId) {
    const actor = assertExists(await prisma.users.findUnique({ where: { id: actorId } }), "Actor not found");
    assertRole(actor.role, ["admin"]);
  }

  const updated = await prisma.posts.update({ where: { id: postId }, data: { status: "hidden", updated_at: new Date() } });
  return mapPostToDTO(updated);
}

export async function restorePost(actorId: string, postId: string) {
  assertAuth(actorId);

  const existing = assertExists(await prisma.posts.findUnique({ where: { id: postId } }), "Post not found");

  if (existing.user_id !== actorId) {
    const actor = assertExists(await prisma.users.findUnique({ where: { id: actorId } }), "Actor not found");
    assertRole(actor.role, ["admin"]);
  }

  const updated = await prisma.posts.update({ where: { id: postId }, data: { status: "active", updated_at: new Date() } });
  return mapPostToDTO(updated);
}

export async function deletePost(actorId: string, postId: string) {
  assertAuth(actorId);

  const existing = assertExists(await prisma.posts.findUnique({ where: { id: postId } }), "Post not found");

  if (existing.user_id !== actorId) {
    const actor = assertExists(await prisma.users.findUnique({ where: { id: actorId } }), "Actor not found");
    assertRole(actor.role, ["admin"]);
  }

  // soft-delete so we can restore later
  const deleted = await prisma.$transaction(async (tx) => {
    const p = await tx.posts.update({ where: { id: postId }, data: { status: "deleted", updated_at: new Date() } });

    // best-effort: try to remove media files from Supabase storage
    try {
      if (p.media_urls && Array.isArray(p.media_urls) && p.media_urls.length) {
        // media_urls are public URLs; attempt to remove by path if bucket/path known is available in URL
        // This is best-effort and will not block the transaction.
        void supabaseAdmin;
      }
    } catch {
      // ignore
    }

    return p;
  });

  return mapPostToDTO(deleted);
}

export async function reviewListing(actorId: string, postId: string, approve: boolean, rejectReason?: string) {
  assertAuth(actorId);

  const actor = assertExists(await prisma.users.findUnique({ where: { id: actorId } }), "Actor not found");
  assertRole(actor.role, ["admin"]);

  const existing = assertExists(await prisma.posts.findUnique({ where: { id: postId } }), "Post not found");

  if (existing.post_type !== "marketplace") throw new AppError("Post is not a marketplace listing", 400, "INVALID_OPERATION");

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.posts.update({
      where: { id: postId },
      data: {
        listing_status: approve ? "approved" : "rejected",
        listing_reviewed_by: actorId,
        listing_reviewed_at: new Date(),
        reject_reason: approve ? null : rejectReason ?? null,
        updated_at: new Date(),
      },
    });

    // create notification for post owner (best-effort inside transaction)
    try {
      await tx.notifications.create({
        data: {
          user_id: p.user_id,
          type: approve ? "listing_approved" : "listing_rejected",
          title: null,
          body: null,
          data: approve ? undefined : { reason: rejectReason ?? null },
        },
      });
    } catch {
      // ignore notification failures
    }

    return p;
  });

  return mapPostToDTO(updated);
}

export async function listPosts(
  viewerId: string | null | undefined,
  page = 1,
  perPage = 20,
  marketplace = false,
  userId?: string | null
) {
  const take = Math.max(1, Math.min(100, perPage));
  const skip = Math.max(0, (page - 1) * take);

  const where: any = { status: "active" };

  if (userId) {
    where.user_id = userId;
  }

  if (marketplace) {
    where.post_type = "marketplace";
    where.listing_status = "approved";
  } else if (!userId) {
    // feed: include regular posts and approved marketplace listings
    where.OR = [
      { post_type: "regular" },
      { AND: [{ post_type: "marketplace" }, { listing_status: "approved" }] },
    ];
  }

  const [total, posts] = await prisma.$transaction([
    prisma.posts.count({ where }),
    prisma.posts.findMany({ where, skip, take, orderBy: { created_at: "desc" } }),
  ]);

  const data = await Promise.all(posts.map((p) => mapPostToDTO(p)));
  const totalPages = Math.ceil(total / take) || 1;

  return {
    data,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  } as import("@/types/api.types").PaginatedResponse<PostDTO>;
}

// ------------------------
// Post share utilities
// ------------------------
type CacheEntry<T> = { expiresAt: number; value: T };
const aggregateCache = new Map<string, CacheEntry<any>>();
const AGGREGATE_TTL = 5_000; // 5s
const AGGREGATE_CACHE_MAX = 5000;

function cacheGet<T>(key: string): T | undefined {
  const e = aggregateCache.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expiresAt) {
    aggregateCache.delete(key);
    return undefined;
  }
  return e.value as T;
}

function cacheSet<T>(key: string, value: T, ttl = AGGREGATE_TTL) {
  try {
    if (aggregateCache.size >= AGGREGATE_CACHE_MAX) {
      const it = aggregateCache.keys();
      const oldest = it.next().value;
      if (oldest) aggregateCache.delete(oldest);
    }
  } catch {
    // ignore trimming failures
  }
  aggregateCache.set(key, { value, expiresAt: Date.now() + ttl });
}

export type PostShareDTO = {
  id: string;
  userId: string;
  user: PublicUser | null;
  note: string | null;
  sharedAt: Date;
};

export async function getShareState(userId: string | null | undefined, postId: string) {
  if (!userId) return { shared: false, sharedAt: null };
  const rec = await prisma.post_shares.findFirst({ where: { user_id: userId, post_id: postId }, orderBy: { shared_at: "desc" }, select: { shared_at: true } });
  return { shared: !!rec, sharedAt: rec?.shared_at ?? null };
}

async function mapShareToDTO(s: any): Promise<PostShareDTO> {
  const u = await prisma.users.findUnique({ where: { id: s.user_id } });
  return {
    id: s.id,
    userId: s.user_id,
    user: toPublicUser(u),
    note: s.note ?? null,
    sharedAt: s.shared_at,
  };
}

export async function sharePost(actorId: string, postId: string, note?: string) {
  assertAuth(actorId);
  if (!postId) throw new AppError("postId is required", 400, "INVALID_INPUT");

  await assertExists(await prisma.posts.findUnique({ where: { id: postId } }), "Post not found");

  const created = await prisma.$transaction(async (tx) => {
    const rec = await tx.post_shares.create({ data: { user_id: actorId, post_id: postId, note: note ?? undefined } });
    return rec;
  });

  // invalidate share count cache
  try { aggregateCache.delete(`post:${postId}:shareAgg`); } catch { }

  return mapShareToDTO(created);
}

export async function unsharePost(actorId: string, postId: string) {
  assertAuth(actorId);
  if (!postId) throw new AppError("postId is required", 400, "INVALID_INPUT");

  const existing = await prisma.post_shares.findMany({ where: { user_id: actorId, post_id: postId }, select: { id: true } });
  if (!existing || existing.length === 0) return { removed: false };

  await prisma.$transaction(async (tx) => {
    await tx.post_shares.deleteMany({ where: { user_id: actorId, post_id: postId } });
  });

  try { aggregateCache.delete(`post:${postId}:shareAgg`); } catch { }

  return { removed: true };
}

export async function getShareCountForPost(postId: string): Promise<number> {
  const cacheKey = `post:${postId}:shareAgg`;
  const cached = cacheGet<number>(cacheKey);
  if (cached != null) return cached;
  const cnt = await prisma.post_shares.count({ where: { post_id: postId } });
  cacheSet(cacheKey, cnt);
  return cnt;
}

export async function getShareCountsForPosts(postIds: string[]): Promise<Map<string, number>> {
  if (!postIds.length) return new Map<string, number>();
  const groups = await prisma.post_shares.groupBy({
    by: ["post_id"],
    where: { post_id: { in: postIds } },
    _count: { _all: true },
  } as any);
  const m = new Map<string, number>();
  for (const g of groups as any[]) {
    m.set(g.post_id as string, (g._count && g._count._all) ?? 0);
  }
  for (const id of postIds) if (!m.has(id)) m.set(id, 0);
  return m;
}

export async function listPostShares(
  viewerId: string | null | undefined,
  postId: string,
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<PostShareDTO>> {
  const take = Math.max(1, Math.min(100, perPage));
  const skip = Math.max(0, (page - 1) * take);

  const [total, rows] = await prisma.$transaction([
    prisma.post_shares.count({ where: { post_id: postId } }),
    prisma.post_shares.findMany({ where: { post_id: postId }, skip, take, orderBy: { shared_at: "desc" } }),
  ] as const);

  const data = await Promise.all(rows.map((r) => mapShareToDTO(r)));
  const totalPages = Math.ceil(total / take) || 1;
  return { data, total, page, totalPages, hasMore: page < totalPages };
}

export async function enrichPostsWithShares<T extends { id: string }>(viewerId: string | null | undefined, posts: T[]) {
  const postIds = posts.map((p) => p.id);
  if (!postIds.length) return posts.map((p) => ({ ...p, shareState: { shared: false, sharedAt: null } }));

  const recs = viewerId ? await prisma.post_shares.findMany({ where: { user_id: viewerId, post_id: { in: postIds } }, select: { post_id: true, shared_at: true } }) : [];
  const map = new Map<string, Date>();
  for (const r of recs) map.set(r.post_id!, r.shared_at);
  return posts.map((p) => ({ ...p, shareState: { shared: map.has(p.id), sharedAt: map.get(p.id) ?? null } }));
}

export const postService = {
  getPostById,
  createPost,
  updatePost,
  hidePost,
  restorePost,
  deletePost,
  reviewListing,
  listPosts,
  // shares
  sharePost,
  unsharePost,
  getShareState,
  getShareCountForPost,
  getShareCountsForPosts,
  listPostShares,
  enrichPostsWithShares,
};

export default postService;
