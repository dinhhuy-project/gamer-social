"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PublicUser } from "@/types/api.types";

async function adminUpdateUserApi(
  id: string,
  input: Partial<Record<string, unknown>>
) {
  const res = await fetch(
    `/api/admin/users/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(input),
    }
  );

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);

    const msg =
      payload?.error || (await res.text());

    throw new Error(msg || "Failed to update user");
  }

  return (await res.json()) as PublicUser;
}

async function adminDeleteUserApi(id: string) {
  const res = await fetch(
    `/api/admin/users/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      credentials: "same-origin",
    }
  );

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);

    const msg =
      payload?.error || (await res.text());

    throw new Error(msg || "Failed to delete user");
  }

  return res.json();
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