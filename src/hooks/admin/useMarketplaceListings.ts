"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";

import { QUERY_KEYS } from "@/lib/constants/query-keys";

import type { AdminPostsResponse, ListingStatus, PostStatus } from "@/types/api.types";

export type MarketplaceListingFilters = {
  search?: string;
  status?: "all" | PostStatus;
  listingStatus?: "all" | ListingStatus;
  page?: number;
  limit?: number;
};

async function fetchMarketplaceListings(filters: MarketplaceListingFilters, signal?: AbortSignal) {
  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.listingStatus && filters.listingStatus !== "all") {
    params.set("listing_status", filters.listingStatus);
  }

  return apiClient<AdminPostsResponse>(`/api/admin/listings?${params.toString()}`, { credentials: "same-origin" }, signal);
}

export function useMarketplaceListings(filters: MarketplaceListingFilters) {
  return useQuery<AdminPostsResponse, Error>({
    queryKey: QUERY_KEYS.adminListings(filters),
    queryFn: ({ signal }) => fetchMarketplaceListings(filters, signal),
    placeholderData: keepPreviousData,
  });
}
