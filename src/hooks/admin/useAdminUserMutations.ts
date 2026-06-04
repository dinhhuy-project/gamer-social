"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";

import type { AdminUserDetail } from "@/types/api.types";

type UpdateUserInput = {
  role?: "user" | "member";
  is_active?: boolean;
};

async function patchAdminUser(id: string, input: UpdateUserInput) {
  return apiClient<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
}

export function useAdminUserMutations() {
  const queryClient = useQueryClient();

  const onSuccess = (user: AdminUserDetail) => {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    queryClient.setQueryData(["admin", "users", user.id], user);
  };

  const updateUserStatus = useMutation<
    AdminUserDetail,
    Error,
    { id: string; isActive: boolean }
  >({
    mutationFn: ({ id, isActive }) => patchAdminUser(id, { is_active: isActive }),
    onSuccess,
  });

  const updateUserRole = useMutation<
    AdminUserDetail,
    Error,
    { id: string; role: "user" | "member" }
  >({
    mutationFn: ({ id, role }) => patchAdminUser(id, { role }),
    onSuccess,
  });

  return {
    updateUserStatus,
    updateUserRole,
    isPending: updateUserStatus.isPending || updateUserRole.isPending,
  };
}
