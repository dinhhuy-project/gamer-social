"use client";

import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";

import type {
  PaginatedResponse,
  PublicUser,
} from "@/types/api.types";

async function fetchUsers(
  page: number,
  perPage: number,
  q?: string
) {
  const params = new URLSearchParams();

  params.set("page", String(page));

  params.set("perPage", String(perPage));

  if (q) {
    params.set("q", q);
  }

  const res = await fetch(
    `/api/users?${params.toString()}`,
    {
      credentials: "same-origin",
    }
  );

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  return (await res.json()) as PaginatedResponse<PublicUser>;
}

export function useUsers(
  page = 1,
  perPage = 20,
  q?: string
) {
  return useQuery<
    PaginatedResponse<PublicUser>,
    Error
  >({
    queryKey: [
      "users",
      page,
      perPage,
      q ?? "",
    ],

    queryFn: () =>
      fetchUsers(page, perPage, q),

    placeholderData: keepPreviousData,
  });
}