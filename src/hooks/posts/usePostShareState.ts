"use client";

import { useQuery } from "@tanstack/react-query";
import type { ShareStateDTO } from "@/types/api.types";

async function fetchShareState(postId: string) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/share`, { credentials: "same-origin" });

  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch share state");
  }

  return (await res.json()) as ShareStateDTO;
}

export function usePostShareState(postId: string) {
  return useQuery<ShareStateDTO, Error>({
    queryKey: ["postShareState", postId],
    queryFn: () => fetchShareState(postId),
    enabled: Boolean(postId),
  });
}
