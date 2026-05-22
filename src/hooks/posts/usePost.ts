"use client";

import { useQuery } from "@tanstack/react-query";
import type { PostDTO } from "@/types/api.types";

async function fetchPost(id: string) {
  const res = await fetch(`/api/posts/${encodeURIComponent(id)}`, { credentials: "same-origin" });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch post");
  }

  return (await res.json()) as PostDTO;
}

export function usePost(id?: string) {
  return useQuery<PostDTO, Error>({
    queryKey: ["posts", id ?? ""],
    queryFn: () => fetchPost(id!),
    enabled: !!id,
  });
}
