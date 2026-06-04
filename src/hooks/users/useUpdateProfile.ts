"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";

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
  return apiClient<CurrentUser>("/api/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
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