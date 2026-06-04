"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";

import { QUERY_KEYS } from "@/lib/constants/query-keys";

import type { AdminUserDetail } from "@/types/api.types";

async function fetchAdminUser(id: string, signal?: AbortSignal) {
  return apiClient<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(id)}`, { credentials: "same-origin" }, signal);
}

export function useAdminUser(id: string | null) {
  return useQuery<AdminUserDetail, Error>({
    queryKey: QUERY_KEYS.adminUser(id ?? ""),
    queryFn: ({ signal }) => fetchAdminUser(id ?? "", signal),
    enabled: Boolean(id),
  });
}
