"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactionSummaryDTO } from "@/types/api.types";

async function fetchCommentReactions(commentId: string) {
  const res = await fetch(`/api/comments/${encodeURIComponent(commentId)}/reactions`, {
    credentials: "same-origin",
  });

  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch reactions");
  }

  return (await res.json()) as ReactionSummaryDTO;
}

export function useCommentReactions(commentId: string) {
  return useQuery<ReactionSummaryDTO, Error>({
    queryKey: ["commentReactions", commentId],
    queryFn: () => fetchCommentReactions(commentId),
    enabled: Boolean(commentId),
  });
}
