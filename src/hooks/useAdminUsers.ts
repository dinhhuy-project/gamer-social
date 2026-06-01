"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/constants/query-keys";

import type { AdminUsersResponse, UserRole } from "@/types/api.types";

export type AdminUsersFilters = {
  search?: string;
  role?: "all" | UserRole;
  isActive?: "all" | "active" | "inactive";
  verified?: "all" | "verified" | "unverified";
  page?: number;
  limit?: number;
};

async function fetchAdminUsers(filters: AdminUsersFilters) {
  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));

  if (filters.search) params.set("search", filters.search);
  if (filters.role && filters.role !== "all") params.set("role", filters.role);
  if (filters.isActive === "active") params.set("is_active", "true");
  if (filters.isActive === "inactive") params.set("is_active", "false");
  if (filters.verified === "verified") params.set("verified", "true");
  if (filters.verified === "unverified") params.set("verified", "false");

  const res = await fetch(`/api/admin/users?${params.toString()}`, {
    credentials: "same-origin",
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? "Failed to fetch admin users");
  }

  return (await res.json()) as AdminUsersResponse;
}

export function useAdminUsers(filters: AdminUsersFilters) {
  return useQuery<AdminUsersResponse, Error>({
    queryKey: QUERY_KEYS.adminUsers(filters),
    queryFn: () => fetchAdminUsers(filters),
    placeholderData: keepPreviousData,
  });
}
