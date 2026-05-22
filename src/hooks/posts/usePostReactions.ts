"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactionSummaryDTO } from "@/types/api.types";

async function fetchPostReactions(postId: string) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/reactions`, {
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

export function usePostReactions(postId: string) {
  return useQuery<ReactionSummaryDTO, Error>({
    queryKey: ["postReactions", postId],
    queryFn: () => fetchPostReactions(postId),
    enabled: Boolean(postId),
  });
}
