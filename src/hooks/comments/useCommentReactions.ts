"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactionSummaryDTO } from "@/types/api.types";
import {
  fetchReactionSummary,
  reactionSummaryKey,
} from "@/hooks/reactions/reaction-api";

export function useCommentReactions(commentId: string) {
  return useQuery<ReactionSummaryDTO, Error>({
    queryKey: reactionSummaryKey("comment", commentId),
    queryFn: ({ signal }) => fetchReactionSummary("comment", commentId, signal),
    enabled: Boolean(commentId),
  });
}
