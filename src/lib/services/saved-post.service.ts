import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppError } from "./shared/app-error";
import { assertAuth, assertExists } from "./shared/assert";
import { Prisma } from "@/generated/prisma/client";
import type { PaginatedResponse } from "@/types/api.types";
import { getPostById } from "./post.service";
import type { PostDTO as PostDTOService } from "./post.service";

// Lightweight in-memory cache for short-lived aggregates (best-effort)
type CacheEntry<T> = { expiresAt: number; value: T };
const aggregateCache = new Map<string, CacheEntry<any>>();
const AGGREGATE_TTL = 5_000; // 5s
const AGGREGATE_CACHE_MAX = 5000; // soft cap to avoid unbounded memory growth

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
  // enforce soft size cap by removing the oldest entries (insertion order)
  try {
    if (aggregateCache.size >= AGGREGATE_CACHE_MAX) {
      const it = aggregateCache.keys();
      const oldest = it.next().value;
      if (oldest) aggregateCache.delete(oldest);
    }
  } catch {
    // ignore cache trimming failures
  }

  aggregateCache.set(key, { value, expiresAt: Date.now() + ttl });
}

export type SavedItemDTO = {
  post: PostDTOService;
  savedAt: Date;
};

export type BookmarkState = { saved: boolean; savedAt: Date | null };

export type SavePostResult =
  | { action: "added"; savedAt: Date; savedCount: number }
  | { action: "already"; savedAt: Date | null; savedCount: number };

// Adapter interface for optional persistence/analytics integrations (collections, signals, cache invalidation)
export type SavedPostAdapter = {
  // optional persistence for user collections (if the DB doesn't include collections)
  collections?: {
    createCollection?: (userId: string, name: string, opts?: any) => Promise<any>;
    updateCollection?: (userId: string, collectionId: string, data: any) => Promise<any>;
    deleteCollection?: (userId: string, collectionId: string) => Promise<any>;
    addPostToCollection?: (userId: string, collectionId: string, postId: string) => Promise<any>;
    removePostFromCollection?: (userId: string, collectionId: string, postId: string) => Promise<any>;
    listCollections?: (userId: string) => Promise<any[]>;
    getCollection?: (userId: string, collectionId: string) => Promise<any | null>;
  };
  // signal hook: view/save/bookmark events for recommendation/analytics engines
  emitSignal?: (type: "view" | "save" | "unsave" | "bookmark", payload: any) => Promise<void>;
  // optional cache invalidation hook
  invalidateCache?: (keys: string[]) => Promise<void>;
};

let adapter: SavedPostAdapter = {};

export function registerSavedPostAdapter(a: SavedPostAdapter) {
  adapter = { ...adapter, ...a };
}

/**
 * Get bookmark state for a given user+post (fast path).
 */
export async function getBookmarkState(userId: string | null | undefined, postId: string): Promise<BookmarkState> {
  if (!userId) return { saved: false, savedAt: null };
  const rec = await prisma.saved_posts.findUnique({
    where: { user_id_post_id: { user_id: userId, post_id: postId } },
    select: { created_at: true },
  });
  return { saved: !!rec, savedAt: rec?.created_at ?? null };
}

/**
 * Save (bookmark) a post for the actor. Uses a transaction and updates caches/signals best-effort.
 */
export async function savePost(actorId: string, postId: string): Promise<SavePostResult> {
  assertAuth(actorId);
  if (!postId) throw new AppError("postId is required", 400, "INVALID_INPUT");

  // ensure post exists and basic visibility checks (reuse post loader semantics)
  const post = assertExists(await prisma.posts.findUnique({ where: { id: postId } }), "Post not found");

  if (post.status !== "active") {
    if (post.user_id !== actorId) {
      const viewer = await prisma.users.findUnique({ where: { id: actorId } });
      if (!viewer || viewer.role !== "admin") throw new AppError("Not found", 404, "NOT_FOUND");
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const rec = await tx.saved_posts.create({ data: { user_id: actorId, post_id: postId } });
      // best-effort analytics / notifications can be added here inside the same tx if desired
      return rec;
    });

    // invalidate small aggregate cache
    aggregateCache.delete(`post:${postId}:savedAgg`);

    // best-effort adapter hooks: invalidate external caches and emit signals
    try {
      if (adapter.invalidateCache) await adapter.invalidateCache([`post:${postId}:savedAgg`]);
    } catch { }
    try {
      if (adapter.emitSignal) await adapter.emitSignal("save", { userId: actorId, postId });
    } catch { }

    void supabaseAdmin; // marker for server-side admin client availability

    const savedAt = created.created_at;
    const count = await getSavedCountForPost(postId);
    return { action: "added", savedAt, savedCount: count };
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // unique constraint: already saved
      const r = await prisma.saved_posts.findUnique({ where: { user_id_post_id: { user_id: actorId, post_id: postId } }, select: { created_at: true } });
      const savedAt = r?.created_at ?? null;
      const count = await getSavedCountForPost(postId);
      return { action: "already", savedAt, savedCount: count };
    }
    throw err;
  }
}

/**
 * Unsave (remove bookmark) for a user.
 */
export async function unsavePost(actorId: string, postId: string): Promise<{ removed: boolean }> {
  assertAuth(actorId);
  if (!postId) throw new AppError("postId is required", 400, "INVALID_INPUT");

  const existing = await prisma.saved_posts.findUnique({ where: { user_id_post_id: { user_id: actorId, post_id: postId } } });
  if (!existing) return { removed: false };

  await prisma.$transaction(async (tx) => {
    await tx.saved_posts.delete({ where: { user_id_post_id: { user_id: actorId, post_id: postId } } });
  });

  aggregateCache.delete(`post:${postId}:savedAgg`);

  // best-effort adapter hooks
  try {
    if (adapter.invalidateCache) await adapter.invalidateCache([`post:${postId}:savedAgg`]);
  } catch { }
  try {
    if (adapter.emitSignal) await adapter.emitSignal("unsave", { userId: actorId, postId });
  } catch { }

  void supabaseAdmin;

  return { removed: true };
}

/**
 * Count saved/bookmarks for a post (cached, best-effort).
 */
export async function getSavedCountForPost(postId: string): Promise<number> {
  const cacheKey = `post:${postId}:savedAgg`;
  const cached = cacheGet<number>(cacheKey);
  if (cached != null) return cached;
  const cnt = await prisma.saved_posts.count({ where: { post_id: postId } });
  cacheSet(cacheKey, cnt);
  return cnt;
}

/**
 * Batch get saved counts for a list of posts.
 */
export async function getSavedCountsForPosts(postIds: string[]): Promise<Map<string, number>> {
  if (!postIds.length) return new Map<string, number>();
  const groups = await prisma.saved_posts.groupBy({
    by: ["post_id"],
    where: { post_id: { in: postIds } },
    _count: { _all: true },
  } as any);
  const m = new Map<string, number>();
  for (const g of groups as any[]) {
    m.set(g.post_id as string, (g._count && g._count._all) ?? 0);
  }
  // ensure every id has a value
  for (const id of postIds) if (!m.has(id)) m.set(id, 0);
  return m;
}

/**
 * Enrich posts with bookmark state for a viewer.
 */
export async function enrichPostsWithBookmarks<T extends { id: string }>(
  viewerId: string | null | undefined,
  posts: T[]
): Promise<(T & { bookmarkState: BookmarkState })[]> {
  const postIds = posts.map((p) => p.id);
  if (!postIds.length) return posts.map((p) => ({ ...p, bookmarkState: { saved: false, savedAt: null } }));

  const recs = viewerId
    ? await prisma.saved_posts.findMany({ where: { user_id: viewerId, post_id: { in: postIds } }, select: { post_id: true, created_at: true } })
    : [];

  const map = new Map<string, Date>();
  for (const r of recs) map.set(r.post_id!, r.created_at);

  return posts.map((p) => ({ ...p, bookmarkState: { saved: map.has(p.id), savedAt: map.get(p.id) ?? null } }));
}

/**
 * Get a user's saved feed (paginated).
 */
export async function getSavedFeed(viewerId: string, page = 1, perPage = 20): Promise<PaginatedResponse<SavedItemDTO>> {
  const take = Math.max(1, Math.min(100, perPage));
  const skip = Math.max(0, (page - 1) * take);

  // select only the fields we need to avoid fetching post payloads twice
  const [total, rows] = await prisma.$transaction([
    prisma.saved_posts.count({ where: { user_id: viewerId } }),
    prisma.saved_posts.findMany({ where: { user_id: viewerId }, select: { post_id: true, created_at: true }, skip, take, orderBy: { created_at: "desc" } }),
  ] as const);

  const data: SavedItemDTO[] = [];
  for (const r of rows) {
    try {
      const p = await getPostById(viewerId, r.post_id as string);
      data.push({ post: p, savedAt: r.created_at });
    } catch {
      // skip posts that are no longer visible to the viewer
    }
  }

  const totalPages = Math.ceil(total / take) || 1;
  return { data, total, page, totalPages, hasMore: page < totalPages };
}

/* ----------------------------
   Collection management (optional adapter)
   - If the project has DB models for collections, register an adapter that implements these.
   - Otherwise these methods will return a 501 AppError.
   ---------------------------- */

async function ensureCollectionsEnabled() {
  if (!adapter.collections) throw new AppError("Collections are not enabled on this deployment", 501, "NOT_IMPLEMENTED");
}

export async function createCollection(userId: string, name: string, opts?: any) {
  assertAuth(userId);
  await ensureCollectionsEnabled();
  if (!adapter.collections?.createCollection) throw new AppError("createCollection not implemented", 501, "NOT_IMPLEMENTED");
  return adapter.collections.createCollection(userId, name, opts);
}

export async function updateCollection(userId: string, collectionId: string, data: any) {
  assertAuth(userId);
  await ensureCollectionsEnabled();
  if (!adapter.collections?.updateCollection) throw new AppError("updateCollection not implemented", 501, "NOT_IMPLEMENTED");
  return adapter.collections.updateCollection(userId, collectionId, data);
}

export async function deleteCollection(userId: string, collectionId: string) {
  assertAuth(userId);
  await ensureCollectionsEnabled();
  if (!adapter.collections?.deleteCollection) throw new AppError("deleteCollection not implemented", 501, "NOT_IMPLEMENTED");
  return adapter.collections.deleteCollection(userId, collectionId);
}

export async function addPostToCollection(userId: string, collectionId: string, postId: string) {
  assertAuth(userId);
  await ensureCollectionsEnabled();
  if (!adapter.collections?.addPostToCollection) throw new AppError("addPostToCollection not implemented", 501, "NOT_IMPLEMENTED");
  return adapter.collections.addPostToCollection(userId, collectionId, postId);
}

export async function removePostFromCollection(userId: string, collectionId: string, postId: string) {
  assertAuth(userId);
  await ensureCollectionsEnabled();
  if (!adapter.collections?.removePostFromCollection) throw new AppError("removePostFromCollection not implemented", 501, "NOT_IMPLEMENTED");
  return adapter.collections.removePostFromCollection(userId, collectionId, postId);
}

export async function listCollections(userId: string) {
  assertAuth(userId);
  await ensureCollectionsEnabled();
  if (!adapter.collections?.listCollections) throw new AppError("listCollections not implemented", 501, "NOT_IMPLEMENTED");
  return adapter.collections.listCollections(userId);
}

export async function getCollection(userId: string, collectionId: string) {
  assertAuth(userId);
  await ensureCollectionsEnabled();
  if (!adapter.collections?.getCollection) throw new AppError("getCollection not implemented", 501, "NOT_IMPLEMENTED");
  return adapter.collections.getCollection(userId, collectionId);
}

/* ----------------------------
   Utilities / exports
   ---------------------------- */

export const savedPostService = {
  getBookmarkState,
  savePost,
  unsavePost,
  getSavedCountForPost,
  getSavedCountsForPosts,
  enrichPostsWithBookmarks,
  getSavedFeed,
  // collections (adapter)
  registerSavedPostAdapter,
  createCollection,
  updateCollection,
  deleteCollection,
  addPostToCollection,
  removePostFromCollection,
  listCollections,
  getCollection,
};

export default savedPostService;
