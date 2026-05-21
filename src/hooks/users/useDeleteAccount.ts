"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

async function deleteAccountApi() {
  const res = await fetch("/api/users/me", {
    method: "DELETE",
    credentials: "same-origin",
  });

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
      msg || "Failed to delete account"
    );
  }

  return res.json();
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