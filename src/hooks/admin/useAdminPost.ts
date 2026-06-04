"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";

import { QUERY_KEYS } from "@/lib/constants/query-keys";

import type { AdminPostDetail, PostStatus } from "@/types/api.types";

async function fetchAdminPost(id: string, signal?: AbortSignal) {
  return apiClient<AdminPostDetail>(`/api/admin/posts/${encodeURIComponent(id)}`, { credentials: "same-origin" }, signal);
}

async function patchAdminPostStatus(id: string, status: PostStatus) {
  return apiClient<AdminPostDetail>(`/api/admin/posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ status }),
  });
}

export function useAdminPost(id: string | null) {
  return useQuery<AdminPostDetail, Error>({
    queryKey: QUERY_KEYS.adminPost(id ?? ""),
    queryFn: ({ signal }) => fetchAdminPost(id ?? "", signal),
    enabled: Boolean(id),
  });
}

export function useUpdateAdminPostStatus() {
  const queryClient = useQueryClient();

  return useMutation<AdminPostDetail, Error, { id: string; status: PostStatus }>({
    mutationFn: ({ id, status }) => patchAdminPostStatus(id, status),
    onSuccess: (post) => {
      queryClient.setQueryData(QUERY_KEYS.adminPost(post.id), post);
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
    },
  });
}
