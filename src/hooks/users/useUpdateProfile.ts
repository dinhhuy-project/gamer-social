"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  CurrentUser,
} from "@/types/api.types";

interface UpdateProfileInput {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
}

async function updateProfileApi(
  input: UpdateProfileInput
) {
  const res = await fetch(
    "/api/users/me",
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
    const payload = await res
      .json()
      .catch(() => null);

    const msg =
      payload?.error || (await res.text());

    throw new Error(
      msg || "Failed to update profile"
    );
  }

  return (await res.json()) as CurrentUser;
}

export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation<
    CurrentUser,
    Error,
    UpdateProfileInput
  >({
    mutationFn: updateProfileApi,

    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: ["me"],
      });

      if (data?.username) {
        qc.invalidateQueries({
          queryKey: [
            "users",
            data.username,
          ],
        });
      }
    },
  });
}