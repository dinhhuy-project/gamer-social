import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppError } from "./shared/app-error";
import { assertAuth, assertExists } from "./shared/assert";
import { Prisma } from "@/generated/prisma/client";
import type { reaction_type } from "@/generated/prisma/enums";

// Lightweight in-memory cache for short-lived aggregates (best-effort)
type CacheEntry<T> = { expiresAt: number; value: T };
const aggregateCache = new Map<string, CacheEntry<any>>();
const AGGREGATE_TTL = 5_000; // 5s

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
  aggregateCache.set(key, { value, expiresAt: Date.now() + ttl });
}

type ReactionCounts = Record<string, number> & {
  total: number;
};

export type ReactionSummaryDTO = {
  targetType: "post" | "comment";
  targetId: string;
  counts: ReactionCounts;
  top: { type: string; count: number }[];
  viewerReaction?: string | null;
  engagementScore: number;
};

const REACTION_WEIGHTS: Record<string, number> = {
  like: 1,
  love: 2,
  haha: 0.5,
  wow: 1,
  sad: 0.2,
  angry: 0.2,
};

function computeEngagementScore(counts: Record<string, number>) {
  let score = 0;
  for (const [k, v] of Object.entries(counts)) {
    const w = REACTION_WEIGHTS[k] ?? 1;
    score += w * v;
  }
  return score;
}

async function loadPostForVisibility(postId: string) {
  return prisma.posts.findUnique({ where: { id: postId } });
}

async function loadCommentForVisibility(commentId: string) {
  return prisma.comments.findUnique({ where: { id: commentId } });
}

/**
 * Get aggregated reaction counts for a post (cached, best-effort).
 */
export async function getPostReactionsSummary(postId: string, viewerId?: string | null): Promise<ReactionSummaryDTO> {
  const cacheKey = `post:${postId}:agg`;
  const cached = cacheGet<ReactionSummaryDTO>(cacheKey);
  if (cached) {
    // attach viewerReaction from DB if viewer provided (not cached per-user)
    if (viewerId) {
      const rec = await prisma.reactions.findUnique({
        where: { user_id_post_id: { user_id: viewerId, post_id: postId } },
        select: { type: true },
      });
      return { ...cached, viewerReaction: rec?.type ?? null };
    }
    return cached;
  }

  // compute aggregates grouped by type
  const groups = await prisma.reactions.groupBy({
    by: ["type"],
    where: { post_id: postId },
    _count: { _all: true },
  } as any);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const g of groups as any[]) {
    const t = g.type as string;
    const c = (g._count && g._count._all) ?? 0;
    counts[t] = c;
    total += c;
  }

  const allTypes = ["like", "love", "haha", "wow", "sad", "angry"];
  for (const t of allTypes) counts[t] = counts[t] ?? 0;

  const top = Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const engagementScore = computeEngagementScore(counts);

  const dto: ReactionSummaryDTO = {
    targetType: "post",
    targetId: postId,
    counts: { ...(counts as any), total },
    top,
    viewerReaction: null,
    engagementScore,
  };

  cacheSet(cacheKey, dto);

  if (viewerId) {
    const rec = await prisma.reactions.findUnique({
      where: { user_id_post_id: { user_id: viewerId, post_id: postId } },
      select: { type: true },
    });
    dto.viewerReaction = rec?.type ?? null;
  }

  return dto;
}

/**
 * Get aggregated reaction counts for a comment (cached, best-effort).
 */
export async function getCommentReactionsSummary(commentId: string, viewerId?: string | null): Promise<ReactionSummaryDTO> {
  const cacheKey = `comment:${commentId}:agg`;
  const cached = cacheGet<ReactionSummaryDTO>(cacheKey);
  if (cached) {
    if (viewerId) {
      const rec = await prisma.reactions.findUnique({
        where: { user_id_comment_id: { user_id: viewerId, comment_id: commentId } },
        select: { type: true },
      });
      return { ...cached, viewerReaction: rec?.type ?? null };
    }
    return cached;
  }

  const groups = await prisma.reactions.groupBy({
    by: ["type"],
    where: { comment_id: commentId },
    _count: { _all: true },
  } as any);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const g of groups as any[]) {
    const t = g.type as string;
    const c = (g._count && g._count._all) ?? 0;
    counts[t] = c;
    total += c;
  }

  const allTypes = ["like", "love", "haha", "wow", "sad", "angry"];
  for (const t of allTypes) counts[t] = counts[t] ?? 0;

  const top = Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const engagementScore = computeEngagementScore(counts);

  const dto: ReactionSummaryDTO = {
    targetType: "comment",
    targetId: commentId,
    counts: { ...(counts as any), total },
    top,
    viewerReaction: null,
    engagementScore,
  };

  cacheSet(cacheKey, dto);

  if (viewerId) {
    const rec = await prisma.reactions.findUnique({
      where: { user_id_comment_id: { user_id: viewerId, comment_id: commentId } },
      select: { type: true },
    });
    dto.viewerReaction = rec?.type ?? null;
  }

  return dto;
}

/**
 * Toggle or set a reaction on a post.
 * If user reacts with the same type => remove (unreact).
 * If user reacts with a different type => update to new type.
 */
export async function reactToPost(actorId: string, postId: string, type: reaction_type) {
  assertAuth(actorId);
  if (!postId) throw new AppError("postId is required", 400, "INVALID_INPUT");

  const post = assertExists(await loadPostForVisibility(postId), "Post not found");

  // permission checks: hidden/deleted posts only owner or admin
  if (post.status !== "active") {
    if (post.user_id !== actorId) {
      const viewer = await prisma.users.findUnique({ where: { id: actorId } });
      if (!viewer || viewer.role !== "admin") throw new AppError("Not found", 404, "NOT_FOUND");
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.reactions.findUnique({
        where: { user_id_post_id: { user_id: actorId, post_id: postId } },
      });

      // toggle: same reaction => delete
      if (existing) {
        if (existing.type === type) {
          await tx.reactions.delete({ where: { id: existing.id } });
          // invalidate cache
          aggregateCache.delete(`post:${postId}:agg`);
          // do not create notifications for removals
          return { action: "removed" as const };
        }

        // update to new type
        await tx.reactions.update({ where: { id: existing.id }, data: { type } });
        aggregateCache.delete(`post:${postId}:agg`);
        try {
          if (post.user_id !== actorId) {
            await tx.notifications.create({ data: { user_id: post.user_id, type: "post_reaction", title: null, body: null, data: { postId, userId: actorId, type } } });
          }
        } catch { }

        return { action: "updated" as const };
      }

      // create
      await tx.reactions.create({ data: { user_id: actorId, post_id: postId, type } });
      aggregateCache.delete(`post:${postId}:agg`);

      try {
        if (post.user_id !== actorId) {
          await tx.notifications.create({ data: { user_id: post.user_id, type: "post_reaction", title: null, body: null, data: { postId, userId: actorId, type } } });
        }
      } catch { }

      return { action: "added" as const };
    });

    // best-effort realtime / analytics hooks (non-blocking)
    try {
      void supabaseAdmin; // placeholder to indicate server-side admin client available
    } catch { }

    // return fresh aggregate
    const summary = await getPostReactionsSummary(postId, actorId);
    return { result, summary };
  } catch (err: any) {
    // unique-constraint race: treat as already reacted
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const summary = await getPostReactionsSummary(postId, actorId);
      return { result: { action: "added" as const }, summary };
    }
    throw err;
  }
}

/**
 * Toggle or set a reaction on a comment.
 */
export async function reactToComment(actorId: string, commentId: string, type: reaction_type) {
  assertAuth(actorId);
  if (!commentId) throw new AppError("commentId is required", 400, "INVALID_INPUT");

  const comment = assertExists(await loadCommentForVisibility(commentId), "Comment not found");

  // permission checks similar to comments
  if (comment.is_deleted) {
    if (comment.user_id !== actorId) {
      const viewer = await prisma.users.findUnique({ where: { id: actorId } });
      if (!viewer || viewer.role !== "admin") throw new AppError("Not found", 404, "NOT_FOUND");
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.reactions.findUnique({ where: { user_id_comment_id: { user_id: actorId, comment_id: commentId } } });

      if (existing) {
        if (existing.type === type) {
          await tx.reactions.delete({ where: { id: existing.id } });
          aggregateCache.delete(`comment:${commentId}:agg`);
          // no notifications for removals
          return { action: "removed" as const };
        }

        await tx.reactions.update({ where: { id: existing.id }, data: { type } });
        aggregateCache.delete(`comment:${commentId}:agg`);
        try {
          if (comment.user_id !== actorId) {
            await tx.notifications.create({ data: { user_id: comment.user_id, type: "post_reaction", title: null, body: null, data: { commentId, userId: actorId, type } } });
          }
        } catch { }
        return { action: "updated" as const };
      }

      await tx.reactions.create({ data: { user_id: actorId, comment_id: commentId, type } });
      aggregateCache.delete(`comment:${commentId}:agg`);
      try {
        if (comment.user_id !== actorId) {
          await tx.notifications.create({ data: { user_id: comment.user_id, type: "post_reaction", title: null, body: null, data: { commentId, userId: actorId, type } } });
        }
      } catch { }
      return { action: "added" as const };
    });

    try {
      void supabaseAdmin;
    } catch { }

    const summary = await getCommentReactionsSummary(commentId, actorId);
    return { result, summary };
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const summary = await getCommentReactionsSummary(commentId, actorId);
      return { result: { action: "added" as const }, summary };
    }
    throw err;
  }
}

/**
 * Remove reaction explicitly (if present).
 */
export async function removeReactionFromPost(actorId: string, postId: string) {
  assertAuth(actorId);
  const existing = await prisma.reactions.findUnique({ where: { user_id_post_id: { user_id: actorId, post_id: postId } } });
  if (!existing) return { removed: false };
  await prisma.$transaction(async (tx) => {
    await tx.reactions.delete({ where: { id: existing.id } });
    // removal: no notification created for unreact
  });
  aggregateCache.delete(`post:${postId}:agg`);
  return { removed: true };
}

export async function removeReactionFromComment(actorId: string, commentId: string) {
  assertAuth(actorId);
  const existing = await prisma.reactions.findUnique({ where: { user_id_comment_id: { user_id: actorId, comment_id: commentId } } });
  if (!existing) return { removed: false };
  await prisma.$transaction(async (tx) => {
    await tx.reactions.delete({ where: { id: existing.id } });
    // removal: no notification created for unreact
  });
  aggregateCache.delete(`comment:${commentId}:agg`);
  return { removed: true };
}

/**
 * Batch enrich posts array with reaction summaries and viewer reactions.
 * Returns a new array of posts where each post has `reactionSummary` property.
 */
export async function enrichPostsWithReactions<T extends { id: string }>(viewerId: string | null | undefined, posts: T[]): Promise<(T & { reactionSummary: ReactionSummaryDTO | null })[]> {
  const postIds = posts.map((p) => p.id);
  if (!postIds.length) return posts.map((p) => ({ ...p, reactionSummary: null }));

  // fetch viewer reactions in batch
  const viewerRecs = viewerId
    ? await prisma.reactions.findMany({ where: { user_id: viewerId, post_id: { in: postIds } }, select: { post_id: true, type: true } })
    : [];

  const viewerMap = new Map<string, string>();
  for (const r of viewerRecs) if (r.post_id) viewerMap.set(r.post_id, r.type);

  // group counts by post_id & type
  const groups = await prisma.reactions.groupBy({
    by: ["post_id", "type"],
    where: { post_id: { in: postIds } },
    _count: { _all: true },
  } as any);

  const aggMap = new Map<string, Record<string, number>>();
  for (const g of groups as any[]) {
    const pid = g.post_id as string;
    const t = g.type as string;
    const c = (g._count && g._count._all) ?? 0;
    const rec = aggMap.get(pid) ?? {};
    rec[t] = (rec[t] ?? 0) + c;
    aggMap.set(pid, rec);
  }

  return posts.map((p) => {
    const countsRaw = aggMap.get(p.id) ?? {};
    const allTypes = ["like", "love", "haha", "wow", "sad", "angry"];
    const counts: Record<string, number> = {};
    let total = 0;
    for (const t of allTypes) {
      counts[t] = countsRaw[t] ?? 0;
      total += counts[t];
    }
    const top = Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 3);
    const engagementScore = computeEngagementScore(counts);

    const summary: ReactionSummaryDTO = {
      targetType: "post",
      targetId: p.id,
      counts: { ...(counts as any), total },
      top,
      viewerReaction: viewerMap.get(p.id) ?? null,
      engagementScore,
    };

    // best-effort cache
    cacheSet(`post:${p.id}:agg`, summary);

    return { ...p, reactionSummary: summary } as T & { reactionSummary: ReactionSummaryDTO };
  });
}

export const reactionService = {
  getPostReactionsSummary,
  getCommentReactionsSummary,
  reactToPost,
  reactToComment,
  removeReactionFromPost,
  removeReactionFromComment,
  enrichPostsWithReactions,
};

export default reactionService;
