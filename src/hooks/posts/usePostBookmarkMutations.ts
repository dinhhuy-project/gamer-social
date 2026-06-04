"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { SavePostResultDTO } from "@/types/api.types";

async function savePostApi(postId: string) {
  return apiClient<SavePostResultDTO>(`/api/posts/${encodeURIComponent(postId)}/save`, { method: "POST", credentials: "same-origin" });
}

async function unsavePostApi(postId: string) {
  return apiClient<{ removed: boolean }>(`/api/posts/${encodeURIComponent(postId)}/save`, { method: "DELETE", credentials: "same-origin" });
}

export function usePostBookmarkMutations() {
  const qc = useQueryClient();

  const saveMutation = useMutation<SavePostResultDTO, Error, string>({
    mutationFn: (postId) => savePostApi(postId),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ["postBookmarkState", postId] });
      const previous = qc.getQueryData(["postBookmarkState", postId]);
      qc.setQueryData(["postBookmarkState", postId], (old: any) => ({ ...(old ?? {}), saved: true, savedAt: new Date().toISOString() }));
      return { previous };
    },
    onError: (_err, postId, context: any) => {
      if (context?.previous) qc.setQueryData(["postBookmarkState", postId], context.previous);
    },
    onSettled: (_data, _err, postId) => {
      qc.invalidateQueries({ queryKey: ["postBookmarkState", postId] });
      qc.invalidateQueries({ queryKey: ["posts", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["me", "saved"] });
    },
  });

  const unsaveMutation = useMutation<any, Error, string>({
    mutationFn: (postId) => unsavePostApi(postId),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ["postBookmarkState", postId] });
      const previous = qc.getQueryData(["postBookmarkState", postId]);
      qc.setQueryData(["postBookmarkState", postId], (old: any) => ({ ...(old ?? {}), saved: false, savedAt: null }));
      return { previous };
    },
    onError: (_err, postId, context: any) => {
      if (context?.previous) qc.setQueryData(["postBookmarkState", postId], context.previous);
    },
    onSettled: (_data, _err, postId) => {
      qc.invalidateQueries({ queryKey: ["postBookmarkState", postId] });
      qc.invalidateQueries({ queryKey: ["posts", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["me", "saved"] });
    },
  });

  return {
    saveMutation,
    unsaveMutation,
    save: (postId: string) => saveMutation.mutate(postId),
    unsave: (postId: string) => unsaveMutation.mutate(postId),
  };
}
