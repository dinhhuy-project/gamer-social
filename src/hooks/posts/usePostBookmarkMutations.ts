"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavePostResultDTO } from "@/types/api.types";

async function savePostApi(postId: string) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/save`, {
    method: "POST",
    credentials: "same-origin",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to save post");
  }

  return (await res.json()) as SavePostResultDTO;
}

async function unsavePostApi(postId: string) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/save`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to unsave post");
  }

  return (await res.json()) as { removed: boolean };
}

export function usePostBookmarkMutations() {
  const qc = useQueryClient();

  const saveMutation = useMutation<SavePostResultDTO, Error, string>({
    mutationFn: (postId) => savePostApi(postId),
    onSuccess: (_data, postId) => {
      qc.invalidateQueries({ queryKey: ["postBookmarkState", postId] });
      qc.invalidateQueries({ queryKey: ["posts", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["me", "saved"] });
    },
  });

  const unsaveMutation = useMutation<any, Error, string>({
    mutationFn: (postId) => unsavePostApi(postId),
    onSuccess: (_data, postId) => {
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
