"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";

import { QUERY_KEYS } from "@/lib/constants/query-keys";

import type { AdminPostsResponse, ListingStatus, PostStatus, PostType } from "@/types/api.types";

export type AdminPostsFilters = {
  search?: string;
  postType?: "all" | PostType;
  status?: "all" | PostStatus;
  listingStatus?: "all" | ListingStatus;
  page?: number;
  limit?: number;
};

function buildParams(filters: AdminPostsFilters) {
  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));
  if (filters.search) params.set("search", filters.search);
  if (filters.postType && filters.postType !== "all") params.set("post_type", filters.postType);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.listingStatus && filters.listingStatus !== "all") {
    params.set("listing_status", filters.listingStatus);
  }

  return params;
}

async function fetchAdminPosts(filters: AdminPostsFilters, signal?: AbortSignal) {
  return apiClient<AdminPostsResponse>(`/api/admin/posts?${buildParams(filters).toString()}`, { credentials: "same-origin" }, signal);
}

export function useAdminPosts(filters: AdminPostsFilters) {
  return useQuery<AdminPostsResponse, Error>({
    queryKey: QUERY_KEYS.adminPosts(filters),
    queryFn: ({ signal }) => fetchAdminPosts(filters, signal),
    placeholderData: keepPreviousData,
  });
}
