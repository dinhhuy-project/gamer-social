"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useIncrementPostView() {
  const queryClient = useQueryClient();

  return useMutation<number, Error, string>({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/view`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        let payload: any = null;
        try {
          payload = await res.json();
        } catch {
          /* ignore */
        }
        throw new Error(payload?.error ?? "Failed to increment view");
      }
      const body = await res.json();
      return (body?.viewCount as number) ?? null as any;
    },
    onSuccess: (viewCount, postId) => {
      try {
        queryClient.setQueryData(["posts", postId as string], (old: any) => {
          if (!old) return old;
          return { ...old, viewCount: viewCount ?? old.viewCount ?? (old._count?.views ?? 0) };
        });
      } catch {
        // ignore cache update failures
      }
    },
  });
}

export default useIncrementPostView;
