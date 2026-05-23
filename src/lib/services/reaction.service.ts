import { prisma } from "@/lib/prisma";
import { AppError } from "./shared/app-error";
import { assertAuth, assertExists } from "./shared/assert";
import type {
  reaction_target_type,
  reaction_type,
} from "@/generated/prisma/enums";

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const aggregateCache = new Map<string, CacheEntry<ReactionSummaryDTO>>();
const AGGREGATE_TTL = 5_000;

const REACTION_TYPES = [
  "like",
  "love",
  "haha",
  "wow",
  "sad",
  "angry",
] as const;

type KnownReactionType = (typeof REACTION_TYPES)[number];

type ReactionCounts = Record<KnownReactionType, number> & {
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

type ReactionTargetType = reaction_target_type;

function cacheGet<T>(key: string): T | undefined {
  const entry = aggregateCache.get(key);

  if (!entry) return undefined;

  if (Date.now() > entry.expiresAt) {
    aggregateCache.delete(key);
    return undefined;
  }

  return entry.value as T;
}

function cacheSet(
  key: string,
  value: ReactionSummaryDTO,
  ttl = AGGREGATE_TTL
) {
  aggregateCache.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

function invalidateReactionCache(
  type: ReactionTargetType,
  id: string
) {
  aggregateCache.delete(`${type}:${id}:agg`);
}

function computeEngagementScore(
  counts: Partial<Record<KnownReactionType, number>> & {
    total?: number;
  }
) {
  let score = 0;

  for (const [type, count] of Object.entries(counts)) {
    if (type === "total") continue;
    score += (REACTION_WEIGHTS[type] ?? 1) * count;
  }

  return score;
}

async function loadPost(postId: string) {
  return prisma.posts.findUnique({
    where: { id: postId },
  });
}

async function loadComment(commentId: string) {
  return prisma.comments.findUnique({
    where: { id: commentId },
  });
}

function buildReactionSummary(
  targetType: ReactionTargetType,
  targetId: string,
  rawCounts: Partial<Record<KnownReactionType, number>>,
  viewerReaction?: string | null
): ReactionSummaryDTO {
  const counts: ReactionCounts = {
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
    total: 0,
  };

  for (const type of REACTION_TYPES) {
    counts[type] = rawCounts[type] ?? 0;
    counts.total += counts[type];
  }

  const top = Object.entries(counts)
    .filter(([type]) => type !== "total")
    .map(([type, count]) => ({
      type,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    targetType,
    targetId,
    counts,
    top,
    viewerReaction: viewerReaction ?? null,
    engagementScore: computeEngagementScore(counts),
  };
}

async function getViewerReaction(
  viewerId: string,
  targetType: ReactionTargetType,
  targetId: string
) {
  const reaction = await prisma.reactions.findFirst({
    where: {
      user_id: viewerId,
      target_type: targetType,
      target_id: targetId,
    },
    select: {
      type: true,
    },
  });

  return reaction?.type ?? null;
}

/* -------------------------------------------------------------------------- */
/*                               POST SUMMARY                                 */
/* -------------------------------------------------------------------------- */

export async function getPostReactionsSummary(
  postId: string,
  viewerId?: string | null
): Promise<ReactionSummaryDTO> {
  assertExists(await loadPost(postId), "Post not found");

  const cacheKey = `post:${postId}:agg`;

  const cached = cacheGet<ReactionSummaryDTO>(cacheKey);

  if (cached) {
    if (viewerId) {
      const viewerReaction = await getViewerReaction(
        viewerId,
        "post",
        postId
      );

      return {
        ...cached,
        viewerReaction,
      };
    }

    return cached;
  }

  const reactions = await prisma.reactions.findMany({
    where: {
      target_type: "post",
      target_id: postId,
    },
    select: {
      type: true,
    },
  });

  const counts: ReactionCounts = {
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
    total: 0,
  };

  for (const reaction of reactions) {
    counts[reaction.type] += 1;
    counts.total += 1;
  }

  const summary = buildReactionSummary(
    "post",
    postId,
    counts
  );

  cacheSet(cacheKey, summary);

  if (viewerId) {
    summary.viewerReaction = await getViewerReaction(
      viewerId,
      "post",
      postId
    );
  }

  return summary;
}

/* -------------------------------------------------------------------------- */
/*                              COMMENT SUMMARY                               */
/* -------------------------------------------------------------------------- */

export async function getCommentReactionsSummary(
  commentId: string,
  viewerId?: string | null
): Promise<ReactionSummaryDTO> {
  assertExists(await loadComment(commentId), "Comment not found");

  const cacheKey = `comment:${commentId}:agg`;

  const cached = cacheGet<ReactionSummaryDTO>(cacheKey);

  if (cached) {
    if (viewerId) {
      const viewerReaction = await getViewerReaction(
        viewerId,
        "comment",
        commentId
      );

      return {
        ...cached,
        viewerReaction,
      };
    }

    return cached;
  }

  const reactions = await prisma.reactions.findMany({
    where: {
      target_type: "comment",
      target_id: commentId,
    },
    select: {
      type: true,
    },
  });

  const counts: ReactionCounts = {
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
    total: 0,
  };

  for (const reaction of reactions) {
    counts[reaction.type] += 1;
    counts.total += 1;
  }

  const summary = buildReactionSummary(
    "comment",
    commentId,
    counts
  );

  cacheSet(cacheKey, summary);

  if (viewerId) {
    summary.viewerReaction = await getViewerReaction(
      viewerId,
      "comment",
      commentId
    );
  }

  return summary;
}

/* -------------------------------------------------------------------------- */
/*                                REACT POST                                  */
/* -------------------------------------------------------------------------- */

export async function reactToPost(
  actorId: string,
  postId: string,
  type: reaction_type
) {
  assertAuth(actorId);

  if (!postId) {
    throw new AppError(
      "postId is required",
      400,
      "INVALID_INPUT"
    );
  }

  const post = assertExists(
    await loadPost(postId),
    "Post not found"
  );

  if (post.status !== "active") {
    if (post.user_id !== actorId) {
      const viewer = await prisma.users.findUnique({
        where: {
          id: actorId,
        },
      });

      if (!viewer || viewer.role !== "admin") {
        throw new AppError(
          "Not found",
          404,
          "NOT_FOUND"
        );
      }
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.reactions.findFirst({
      where: {
        user_id: actorId,
        target_type: "post",
        target_id: postId,
      },
    });

    if (existing) {
      if (existing.type === type) {
        await tx.reactions.delete({
          where: {
            id: existing.id,
          },
        });

        invalidateReactionCache("post", postId);

        return {
          action: "removed" as const,
        };
      }

      await tx.reactions.update({
        where: {
          id: existing.id,
        },
        data: {
          type,
        },
      });

      invalidateReactionCache("post", postId);

      return {
        action: "updated" as const,
      };
    }

    await tx.reactions.create({
      data: {
        user_id: actorId,
        target_type: "post",
        target_id: postId,
        type,
      },
    });

    invalidateReactionCache("post", postId);

    if (post.user_id !== actorId) {
      try {
        await tx.notifications.create({
          data: {
            user_id: post.user_id,
            type: "post_reaction",
            title: null,
            body: null,
            data: {
              postId,
              userId: actorId,
              type,
            },
          },
        });
      } catch { }
    }

    return {
      action: "added" as const,
    };
  });

  const summary = await getPostReactionsSummary(
    postId,
    actorId
  );

  return {
    result,
    summary,
  };
}

/* -------------------------------------------------------------------------- */
/*                               REACT COMMENT                                */
/* -------------------------------------------------------------------------- */

export async function reactToComment(
  actorId: string,
  commentId: string,
  type: reaction_type
) {
  assertAuth(actorId);

  if (!commentId) {
    throw new AppError(
      "commentId is required",
      400,
      "INVALID_INPUT"
    );
  }

  const comment = assertExists(
    await loadComment(commentId),
    "Comment not found"
  );

  if (comment.is_deleted) {
    if (comment.user_id !== actorId) {
      const viewer = await prisma.users.findUnique({
        where: {
          id: actorId,
        },
      });

      if (!viewer || viewer.role !== "admin") {
        throw new AppError(
          "Not found",
          404,
          "NOT_FOUND"
        );
      }
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.reactions.findFirst({
      where: {
        user_id: actorId,
        target_type: "comment",
        target_id: commentId,
      },
    });

    if (existing) {
      if (existing.type === type) {
        await tx.reactions.delete({
          where: {
            id: existing.id,
          },
        });

        invalidateReactionCache(
          "comment",
          commentId
        );

        return {
          action: "removed" as const,
        };
      }

      await tx.reactions.update({
        where: {
          id: existing.id,
        },
        data: {
          type,
        },
      });

      invalidateReactionCache(
        "comment",
        commentId
      );

      return {
        action: "updated" as const,
      };
    }

    await tx.reactions.create({
      data: {
        user_id: actorId,
        target_type: "comment",
        target_id: commentId,
        type,
      },
    });

    invalidateReactionCache(
      "comment",
      commentId
    );

    if (comment.user_id !== actorId) {
      try {
        await tx.notifications.create({
          data: {
            user_id: comment.user_id,
            type: "post_reaction",
            title: null,
            body: null,
            data: {
              commentId,
              userId: actorId,
              type,
            },
          },
        });
      } catch { }
    }

    return {
      action: "added" as const,
    };
  });

  const summary =
    await getCommentReactionsSummary(
      commentId,
      actorId
    );

  return {
    result,
    summary,
  };
}

/* -------------------------------------------------------------------------- */
/*                             REMOVE REACTIONS                               */
/* -------------------------------------------------------------------------- */

export async function removeReactionFromPost(
  actorId: string,
  postId: string
) {
  assertAuth(actorId);

  const existing = await prisma.reactions.findFirst({
    where: {
      user_id: actorId,
      target_type: "post",
      target_id: postId,
    },
  });

  if (!existing) {
    return {
      removed: false,
    };
  }

  await prisma.reactions.delete({
    where: {
      id: existing.id,
    },
  });

  invalidateReactionCache("post", postId);

  return {
    removed: true,
  };
}

export async function removeReactionFromComment(
  actorId: string,
  commentId: string
) {
  assertAuth(actorId);

  const existing = await prisma.reactions.findFirst({
    where: {
      user_id: actorId,
      target_type: "comment",
      target_id: commentId,
    },
  });

  if (!existing) {
    return {
      removed: false,
    };
  }

  await prisma.reactions.delete({
    where: {
      id: existing.id,
    },
  });

  invalidateReactionCache(
    "comment",
    commentId
  );

  return {
    removed: true,
  };
}

/* -------------------------------------------------------------------------- */
/*                         ENRICH POSTS WITH REACTIONS                        */
/* -------------------------------------------------------------------------- */

export async function enrichPostsWithReactions<
  T extends { id: string }
>(
  viewerId: string | null | undefined,
  posts: T[]
): Promise<
  (T & {
    reactionSummary: ReactionSummaryDTO | null;
  })[]
> {
  const postIds = posts.map((post) => post.id);

  if (!postIds.length) {
    return posts.map((post) => ({
      ...post,
      reactionSummary: null,
    }));
  }

  const viewerReactions = viewerId
    ? await prisma.reactions.findMany({
      where: {
        user_id: viewerId,
        target_type: "post",
        target_id: {
          in: postIds,
        },
      },
      select: {
        target_id: true,
        type: true,
      },
    })
    : [];

  const viewerMap = new Map<string, string>();

  for (const reaction of viewerReactions) {
    if (reaction.target_id) {
      viewerMap.set(
        reaction.target_id,
        reaction.type
      );
    }
  }

  const reactions = await prisma.reactions.findMany({
    where: {
      target_type: "post",
      target_id: {
        in: postIds,
      },
    },
    select: {
      target_id: true,
      type: true,
    },
  });

  const aggregateMap = new Map<string, ReactionCounts>();

  for (const reaction of reactions) {
    const current =
      aggregateMap.get(reaction.target_id) ?? {
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
        total: 0,
      };

    current[reaction.type] += 1;
    current.total += 1;
    aggregateMap.set(reaction.target_id, current);
  }

  return posts.map((post) => {
    const counts =
      aggregateMap.get(post.id) ?? {
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
        total: 0,
      };

    const summary = buildReactionSummary(
      "post",
      post.id,
      counts,
      viewerMap.get(post.id) ?? null
    );

    cacheSet(`post:${post.id}:agg`, summary);

    return {
      ...post,
      reactionSummary: summary,
    };
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