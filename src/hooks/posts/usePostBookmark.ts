"use client";

import { useQuery } from "@tanstack/react-query";
import type { BookmarkStateDTO } from "@/types/api.types";

async function fetchBookmarkState(postId: string) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/save`, { credentials: "same-origin" });

  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch bookmark state");
  }

  return (await res.json()) as BookmarkStateDTO;
}

export function usePostBookmarkState(postId: string) {
  return useQuery<BookmarkStateDTO, Error>({
    queryKey: ["postBookmarkState", postId],
    queryFn: () => fetchBookmarkState(postId),
    enabled: Boolean(postId),
  });
}
