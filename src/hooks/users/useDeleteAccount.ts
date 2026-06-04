"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";

async function deleteAccountApi() {
  return apiClient<unknown>("/api/users/me", { method: "DELETE", credentials: "same-origin" });
}

export function useDeleteAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteAccountApi,

    onSuccess: () => {
      qc.removeQueries({
        queryKey: ["me"],
      });

      qc.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });
}