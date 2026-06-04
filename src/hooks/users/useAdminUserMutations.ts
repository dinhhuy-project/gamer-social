"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";

import type { PublicUser } from "@/types/api.types";

async function adminUpdateUserApi(
  id: string,
  input: Partial<Record<string, unknown>>
) {
  return apiClient<PublicUser>(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
}

async function adminDeleteUserApi(id: string) {
  return apiClient<unknown>(`/api/admin/users/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" });
}

export function useAdminUpdateUser() {
  const qc = useQueryClient();

  return useMutation<
    PublicUser,
    Error,
    {
      id: string;
      input: Partial<Record<string, unknown>>;
    }
  >({
    mutationFn: ({ id, input }) =>
      adminUpdateUserApi(id, input),

    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: ["users"],
      });

      if (data?.username) {
        qc.invalidateQueries({
          queryKey: ["users", data.username],
        });
      }
    },
  });
}

export function useAdminDeleteUser() {
  const qc = useQueryClient();

  return useMutation<
    unknown,
    Error,
    string
  >({
    mutationFn: (id) =>
      adminDeleteUserApi(id),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });
}