"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";

import { QUERY_KEYS } from "@/lib/constants/query-keys";

import type { AdminPostDetail } from "@/types/api.types";

async function reviewListingApi(input: {
  id: string;
  action: "approve" | "reject";
  rejectReason?: string;
}) {
  return apiClient<AdminPostDetail>(`/api/admin/listings/${encodeURIComponent(input.id)}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action: input.action, reject_reason: input.rejectReason }),
  });
}

export function useReviewListing() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminPostDetail,
    Error,
    { id: string; action: "approve" | "reject"; rejectReason?: string }
  >({
    mutationFn: reviewListingApi,
    onSuccess: (post) => {
      queryClient.setQueryData(QUERY_KEYS.adminPost(post.id), post);
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
    },
  });
}
