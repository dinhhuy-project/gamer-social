"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";

export function useIncrementPostView() {
  const queryClient = useQueryClient();

  return useMutation<number, Error, string>({
    mutationFn: async (postId: string) => {
      const body = await apiClient<{ viewCount?: number }>(`/api/posts/${encodeURIComponent(postId)}/view`, { method: "POST", credentials: "same-origin" });
      return (body?.viewCount as number) ?? (null as any);
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
