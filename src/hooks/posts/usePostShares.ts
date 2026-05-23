"use client";

import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse, PostShareDTO } from "@/types/api.types";

async function fetchPostShares(postId: string, page = 1, perPage = 20) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/shares?${params.toString()}`, { credentials: "same-origin" });

  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch shares");
  }

  return (await res.json()) as PaginatedResponse<PostShareDTO>;
}

export function usePostShares(postId: string, page = 1, perPage = 20) {
  return useQuery<PaginatedResponse<PostShareDTO>, Error>({
    queryKey: ["postShares", postId, page],
    queryFn: () => fetchPostShares(postId, page, perPage),
    enabled: Boolean(postId),
  });
}
