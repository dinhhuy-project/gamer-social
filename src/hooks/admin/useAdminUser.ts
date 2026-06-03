"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/constants/query-keys";

import type { AdminUserDetail } from "@/types/api.types";

async function fetchAdminUser(id: string) {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    credentials: "same-origin",
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? "Failed to fetch user detail");
  }

  return (await res.json()) as AdminUserDetail;
}

export function useAdminUser(id: string | null) {
  return useQuery<AdminUserDetail, Error>({
    queryKey: QUERY_KEYS.adminUser(id ?? ""),
    queryFn: () => fetchAdminUser(id ?? ""),
    enabled: Boolean(id),
  });
}
