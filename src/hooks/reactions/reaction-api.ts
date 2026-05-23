"use client";

import type { ReactionSummaryDTO, ReactionType } from "@/types/api.types";

export type ReactionTargetType = "post" | "comment";
export type ReactionAction = "added" | "updated" | "removed";

export type ReactionMutationResponse = {
  result: {
    action: ReactionAction;
  };
  summary: ReactionSummaryDTO;
};

export type ReactionDeleteResponse = {
  removed: boolean;
};

const REACTION_TYPES: ReactionType[] = [
  "like",
  "love",
  "haha",
  "wow",
  "sad",
  "angry",
];

function getErrorMessage(response: Response, fallback: string) {
  if (response.status === 401) {
    return "Unauthorized";
  }

  if (response.status === 404) {
    return "Not found";
  }

  return response.text().then((text) => {
    if (!text) {
      return fallback;
    }

    try {
      const payload = JSON.parse(text) as { error?: string };
      return payload.error || fallback;
    } catch {
      return text || fallback;
    }
  });
}

async function requestJson<T>(input: string, init: RequestInit, fallback: string) {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallback));
  }

  return (await response.json()) as T;
}

export function reactionPath(targetType: ReactionTargetType, targetId: string) {
  const encodedId = encodeURIComponent(targetId);

  return targetType === "post"
    ? `/api/posts/${encodedId}/reactions`
    : `/api/comments/${encodedId}/reactions`;
}

export function reactionSummaryKey(targetType: ReactionTargetType, targetId: string) {
  return [
    targetType === "post" ? "postReactions" : "commentReactions",
    targetId,
  ] as const;
}

export async function fetchReactionSummary(
  targetType: ReactionTargetType,
  targetId: string
) {
  return requestJson<ReactionSummaryDTO>(
    reactionPath(targetType, targetId),
    { credentials: "same-origin" },
    "Failed to fetch reactions"
  );
}

export async function reactToReaction(
  targetType: ReactionTargetType,
  targetId: string,
  type: ReactionType
) {
  return requestJson<ReactionMutationResponse>(
    reactionPath(targetType, targetId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ type }),
    },
    targetType === "post"
      ? "Failed to react to post"
      : "Failed to react to comment"
  );
}

export async function removeReactionFromTarget(
  targetType: ReactionTargetType,
  targetId: string
) {
  return requestJson<ReactionDeleteResponse>(
    reactionPath(targetType, targetId),
    {
      method: "DELETE",
      credentials: "same-origin",
    },
    "Failed to remove reaction"
  );
}

export function buildTopItems(counts: ReactionSummaryDTO["counts"]) {
  return REACTION_TYPES.map((type) => ({
    type,
    count: counts[type],
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export function getOptimisticReactionAction(
  current: ReactionSummaryDTO | undefined,
  requestedType: ReactionType
): ReactionAction {
  if (!current?.viewerReaction) {
    return "added";
  }

  if (current.viewerReaction === requestedType) {
    return "removed";
  }

  return "updated";
}

export function getReactionCountDelta(action: ReactionAction) {
  if (action === "added") {
    return 1;
  }

  if (action === "removed") {
    return -1;
  }

  return 0;
}

export function applyReactionOptimisticUpdate(
  current: ReactionSummaryDTO | undefined,
  action: ReactionAction,
  requestedType: ReactionType
): ReactionSummaryDTO | undefined {
  if (!current) {
    return current;
  }

  const nextCounts = { ...current.counts };
  const next = {
    ...current,
    counts: nextCounts,
    top: [...current.top],
  };

  if (action === "added") {
    next.counts[requestedType] += 1;
    next.counts.total += 1;
    next.viewerReaction = requestedType;
  } else if (action === "updated") {
    const previousReaction = current.viewerReaction;

    if (previousReaction && previousReaction !== requestedType) {
      next.counts[previousReaction] = Math.max(0, next.counts[previousReaction] - 1);
    }

    next.counts[requestedType] += 1;
    next.viewerReaction = requestedType;
  } else {
    const previousReaction = current.viewerReaction;

    if (previousReaction) {
      next.counts[previousReaction] = Math.max(0, next.counts[previousReaction] - 1);
      next.counts.total = Math.max(0, next.counts.total - 1);
      next.viewerReaction = null;
    }
  }

  next.top = buildTopItems(next.counts);

  return next;
}

export function updatePostCacheReactionCount(
  postCache: unknown,
  delta: number
) {
  if (!postCache || typeof postCache !== "object") {
    return postCache;
  }

  const cachedPost = postCache as {
    _count?: {
      reactions?: number | null;
    };
  };

  if (typeof cachedPost._count?.reactions !== "number") {
    return postCache;
  }

  return {
    ...cachedPost,
    _count: {
      ...cachedPost._count,
      reactions: Math.max(0, cachedPost._count.reactions + delta),
    },
  };
}
