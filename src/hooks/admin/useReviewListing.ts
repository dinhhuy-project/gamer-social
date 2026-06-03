"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/constants/query-keys";

import type { AdminPostDetail } from "@/types/api.types";

async function reviewListingApi(input: {
  id: string;
  action: "approve" | "reject";
  rejectReason?: string;
}) {
  const res = await fetch(`/api/admin/listings/${encodeURIComponent(input.id)}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      action: input.action,
      reject_reason: input.rejectReason,
    }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? "Failed to review listing");
  }

  return (await res.json()) as AdminPostDetail;
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
