"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactionSummaryDTO, ReactionType } from "@/types/api.types";
import {
  applyReactionOptimisticUpdate,
  getOptimisticReactionAction,
  getReactionCountDelta,
  reactToReaction,
  reactionSummaryKey,
  removeReactionFromTarget,
  updatePostCacheReactionCount,
} from "@/hooks/reactions/reaction-api";

type PostReactionVariables = {
  postId: string;
  type: ReactionType;
};

type PostReactionContext = {
  previous: ReactionSummaryDTO | undefined;
};

export function usePostReactionMutations() {
  const qc = useQueryClient();

  const reactMutation = useMutation<
    Awaited<ReturnType<typeof reactToReaction>>,
    Error,
    PostReactionVariables,
    PostReactionContext
  >({
    mutationFn: ({ postId, type }) => reactToReaction("post", postId, type),
    onMutate: async ({ postId, type }) => {
      const reactionKey = reactionSummaryKey("post", postId);
      await qc.cancelQueries({ queryKey: reactionKey });

      const previous = qc.getQueryData<ReactionSummaryDTO>(reactionKey);
      const optimisticAction = getOptimisticReactionAction(previous, type);

      qc.setQueryData<ReactionSummaryDTO | undefined>(
        reactionKey,
        (current) => applyReactionOptimisticUpdate(current, optimisticAction, type)
      );

      qc.setQueryData(["posts", postId], (current: unknown) =>
        updatePostCacheReactionCount(current, getReactionCountDelta(optimisticAction))
      );

      return { previous };
    },
    onError: (_error, variables, context) => {
      if (context?.previous) {
        qc.setQueryData(reactionSummaryKey("post", variables.postId), context.previous);
      }
    },
    onSettled: (_data, _error, variables) => {
      qc.invalidateQueries({ queryKey: reactionSummaryKey("post", variables.postId) });
      qc.invalidateQueries({ queryKey: ["posts", variables.postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const removeMutation = useMutation<
    Awaited<ReturnType<typeof removeReactionFromTarget>>,
    Error,
    string,
    PostReactionContext
  >({
    mutationFn: (postId) => removeReactionFromTarget("post", postId),
    onMutate: async (postId) => {
      const reactionKey = reactionSummaryKey("post", postId);
      await qc.cancelQueries({ queryKey: reactionKey });

      const previous = qc.getQueryData<ReactionSummaryDTO>(reactionKey);

      qc.setQueryData<ReactionSummaryDTO | undefined>(reactionKey, (current) =>
        applyReactionOptimisticUpdate(current, "removed", previous?.viewerReaction ?? "like")
      );

      qc.setQueryData(["posts", postId], (current: unknown) =>
        updatePostCacheReactionCount(current, getReactionCountDelta("removed"))
      );

      return { previous };
    },
    onError: (_error, postId, context) => {
      if (context?.previous) {
        qc.setQueryData(reactionSummaryKey("post", postId), context.previous);
      }
    },
    onSettled: (_data, _error, postId) => {
      qc.invalidateQueries({ queryKey: reactionSummaryKey("post", postId) });
      qc.invalidateQueries({ queryKey: ["posts", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    reactMutation,
    removeMutation,
    react: (postId: string, type: ReactionType) =>
      reactMutation.mutate({ postId, type }),
    remove: (postId: string) => removeMutation.mutate(postId),
  };
}
