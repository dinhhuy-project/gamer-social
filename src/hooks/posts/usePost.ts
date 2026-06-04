"use client";

import { useQuery } from "@tanstack/react-query";
import type { PostDTO } from "@/types/api.types";
import { apiClient } from "@/lib/api/api-client";

async function fetchPost(id: string, signal?: AbortSignal) {
  return apiClient<PostDTO>(`/api/posts/${encodeURIComponent(id)}`, { credentials: "same-origin" }, signal);
}

export function usePost(id?: string) {
  return useQuery<PostDTO, Error>({
    queryKey: ["posts", id ?? ""],
    queryFn: ({ signal }) => fetchPost(id!, signal),
    enabled: !!id,
  });
}
