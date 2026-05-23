"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactionSummaryDTO } from "@/types/api.types";
import {
  fetchReactionSummary,
  reactionSummaryKey,
} from "@/hooks/reactions/reaction-api";

export function usePostReactions(postId: string) {
  return useQuery<ReactionSummaryDTO, Error>({
    queryKey: reactionSummaryKey("post", postId),
    queryFn: () => fetchReactionSummary("post", postId),
    enabled: Boolean(postId),
  });
}
