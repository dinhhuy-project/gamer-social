"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactionSummaryDTO, ReactionType } from "@/types/api.types";
import {
  applyReactionOptimisticUpdate,
  getOptimisticReactionAction,
  reactToReaction,
  reactionSummaryKey,
  removeReactionFromTarget,
} from "@/hooks/reactions/reaction-api";

type CommentReactionVariables = {
  commentId: string;
  type: ReactionType;
};

type CommentReactionContext = {
  previous: ReactionSummaryDTO | undefined;
};

export function useCommentReactionMutations() {
  const qc = useQueryClient();

  const reactMutation = useMutation<
    Awaited<ReturnType<typeof reactToReaction>>,
    Error,
    CommentReactionVariables,
    CommentReactionContext
  >({
    mutationFn: ({ commentId, type }) => reactToReaction("comment", commentId, type),
    onMutate: async ({ commentId, type }) => {
      const reactionKey = reactionSummaryKey("comment", commentId);
      await qc.cancelQueries({ queryKey: reactionKey });

      const previous = qc.getQueryData<ReactionSummaryDTO>(reactionKey);
      const optimisticAction = getOptimisticReactionAction(previous, type);

      qc.setQueryData<ReactionSummaryDTO | undefined>(
        reactionKey,
        (current) => applyReactionOptimisticUpdate(current, optimisticAction, type)
      );

      return { previous };
    },
    onError: (_error, variables, context) => {
      if (context?.previous) {
        qc.setQueryData(reactionSummaryKey("comment", variables.commentId), context.previous);
      }
    },
    onSettled: (_data, _error, variables) => {
      qc.invalidateQueries({ queryKey: reactionSummaryKey("comment", variables.commentId) });
      qc.invalidateQueries({ queryKey: ["comment", variables.commentId] });
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const removeMutation = useMutation<
    Awaited<ReturnType<typeof removeReactionFromTarget>>,
    Error,
    string,
    CommentReactionContext
  >({
    mutationFn: (commentId) => removeReactionFromTarget("comment", commentId),
    onMutate: async (commentId) => {
      const reactionKey = reactionSummaryKey("comment", commentId);
      await qc.cancelQueries({ queryKey: reactionKey });

      const previous = qc.getQueryData<ReactionSummaryDTO>(reactionKey);

      qc.setQueryData<ReactionSummaryDTO | undefined>(reactionKey, (current) =>
        applyReactionOptimisticUpdate(current, "removed", previous?.viewerReaction ?? "like")
      );

      return { previous };
    },
    onError: (_error, commentId, context) => {
      if (context?.previous) {
        qc.setQueryData(reactionSummaryKey("comment", commentId), context.previous);
      }
    },
    onSettled: (_data, _error, commentId) => {
      qc.invalidateQueries({ queryKey: reactionSummaryKey("comment", commentId) });
      qc.invalidateQueries({ queryKey: ["comment", commentId] });
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    reactMutation,
    removeMutation,
    react: (commentId: string, type: ReactionType) =>
      reactMutation.mutate({ commentId, type }),
    remove: (commentId: string) => removeMutation.mutate(commentId),
  };
}
