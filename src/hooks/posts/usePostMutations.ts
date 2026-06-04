"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { PostDTO } from "@/types/api.types";

async function createPostApi(input: any) {
  return apiClient<PostDTO>(`/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
}

async function updatePostApi(id: string, input: any) {
  return apiClient<PostDTO>(`/api/posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
}

async function deletePostApi(id: string) {
  return apiClient<PostDTO>(`/api/posts/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" });
}

async function actionPostApi(id: string, action: "hide" | "restore") {
  return apiClient<PostDTO>(`/api/posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action }),
  });
}

async function reviewListingApi(id: string, approve: boolean, rejectReason?: string) {
  return apiClient<PostDTO>(`/api/admin/listings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ approve, rejectReason }),
  });
}

export function usePostMutations() {
  const qc = useQueryClient();

  const createMutation = useMutation<PostDTO, Error, any>({
    mutationFn: createPostApi,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["me"] });

      // If the created post references another post (a share), invalidate share caches for that target post
      try {
        const content = (data && (data as any).content) || "";
        const uuidMatch = content.match(/\/posts\/([0-9a-fA-F\-]{36})\b/);
        const simpleMatch = content.match(/\/posts\/([A-Za-z0-9_-]{6,64})/);
        const match = uuidMatch ?? simpleMatch;
        if (match && match[1]) {
          const sharedId = match[1];
          qc.invalidateQueries({ queryKey: ["postShares", sharedId] });
          qc.invalidateQueries({ queryKey: ["postShareState", sharedId] });
          qc.invalidateQueries({ queryKey: ["posts", sharedId] });
        }
      } catch {
        // ignore
      }
    },
  });

  const updateMutation = useMutation<PostDTO, Error, { id: string; input: any }>(
    {
      mutationFn: ({ id, input }) => updatePostApi(id, input),
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: ["posts", data.id] });
        qc.invalidateQueries({ queryKey: ["posts"] });
      },
    }
  );

  const deleteMutation = useMutation<PostDTO, Error, string>({
    mutationFn: (id) => deletePostApi(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["posts", data.id] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const hideMutation = useMutation<PostDTO, Error, string>({
    mutationFn: (id) => actionPostApi(id, "hide"),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["posts", data.id] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const restoreMutation = useMutation<PostDTO, Error, string>({
    mutationFn: (id) => actionPostApi(id, "restore"),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["posts", data.id] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const reviewMutation = useMutation<PostDTO, Error, { id: string; approve: boolean; rejectReason?: string }>(
    {
      mutationFn: ({ id, approve, rejectReason }) => reviewListingApi(id, approve, rejectReason),
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: ["posts", data.id] });
        qc.invalidateQueries({ queryKey: ["posts"] });
        qc.invalidateQueries({ queryKey: ["me"] });
      },
    }
  );

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    hideMutation,
    restoreMutation,
    reviewMutation,
    create: (input: any) => createMutation.mutate(input),
    update: (id: string, input: any) => updateMutation.mutate({ id, input }),
    remove: (id: string) => deleteMutation.mutate(id),
    hide: (id: string) => hideMutation.mutate(id),
    restore: (id: string) => restoreMutation.mutate(id),
    review: (id: string, approve: boolean, rejectReason?: string) => reviewMutation.mutate({ id, approve, rejectReason }),
  };
}
