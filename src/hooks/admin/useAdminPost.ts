"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/constants/query-keys";

import type { AdminPostDetail, PostStatus } from "@/types/api.types";

async function fetchAdminPost(id: string) {
  const res = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, {
    credentials: "same-origin",
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? "Failed to fetch post detail");
  }

  return (await res.json()) as AdminPostDetail;
}

async function patchAdminPostStatus(id: string, status: PostStatus) {
  const res = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? "Failed to update post status");
  }

  return (await res.json()) as AdminPostDetail;
}

export function useAdminPost(id: string | null) {
  return useQuery<AdminPostDetail, Error>({
    queryKey: QUERY_KEYS.adminPost(id ?? ""),
    queryFn: () => fetchAdminPost(id ?? ""),
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
