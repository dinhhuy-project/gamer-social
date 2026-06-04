"use client";

import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";

import { apiClient } from "@/lib/api/api-client";

import type {
  PaginatedResponse,
  PublicUser,
} from "@/types/api.types";

async function fetchUsers(
  page: number,
  perPage: number,
  q?: string,
  signal?: AbortSignal
) {
  const params = new URLSearchParams();

  params.set("page", String(page));

  params.set("perPage", String(perPage));

  if (q) {
    params.set("q", q);
  }

  return apiClient<PaginatedResponse<PublicUser>>(`/api/users?${params.toString()}`, { credentials: "same-origin" }, signal);
}

export function useUsers(
  page = 1,
  perPage = 20,
  q?: string
) {
  return useQuery<PaginatedResponse<PublicUser>, Error>({
    queryKey: ["users", page, perPage, q ?? ""],
    queryFn: ({ signal }) => fetchUsers(page, perPage, q, signal),
    placeholderData: keepPreviousData,
  });
}