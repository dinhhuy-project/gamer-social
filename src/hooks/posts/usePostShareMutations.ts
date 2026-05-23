"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PostShareDTO } from "@/types/api.types";

async function sharePostApi(postId: string, note?: string) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ note }),
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to share post");
  }

  return (await res.json()) as PostShareDTO;
}

async function unsharePostApi(postId: string) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/share`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to unshare post");
  }

  return (await res.json()) as { removed: boolean };
}

export function usePostShareMutations() {
  const qc = useQueryClient();

  const shareMutation = useMutation<PostShareDTO, Error, { postId: string; note?: string }>({
    mutationFn: ({ postId, note }) => sharePostApi(postId, note),
    onMutate: async ({ postId }) => {
      await qc.cancelQueries({ queryKey: ["postShareState", postId] });
      const previous = qc.getQueryData(["postShareState", postId]);
      qc.setQueryData(["postShareState", postId], (old: any) => ({ ...(old ?? {}), shared: true, sharedAt: new Date().toISOString() }));

      // optimistic post cache update if server keeps _count.shares
      const postCache = qc.getQueryData(["posts", postId]) as any;
      if (postCache && postCache._count && typeof postCache._count.shares === "number") {
        qc.setQueryData(["posts", postId], { ...postCache, _count: { ...postCache._count, shares: postCache._count.shares + 1 } });
      }

      return { previous };
    },
    onError: (_err, variables, context: any) => {
      if (context?.previous) qc.setQueryData(["postShareState", variables.postId], context.previous);
    },
    onSettled: (_data, _err, variables) => {
      qc.invalidateQueries({ queryKey: ["postShareState", variables.postId] });
      qc.invalidateQueries({ queryKey: ["posts", variables.postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["me", "shares"] });
    },
  });

  const unshareMutation = useMutation<any, Error, string>({
    mutationFn: (postId) => unsharePostApi(postId),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ["postShareState", postId] });
      const previous = qc.getQueryData(["postShareState", postId]);
      qc.setQueryData(["postShareState", postId], (old: any) => ({ ...(old ?? {}), shared: false, sharedAt: null }));

      const postCache = qc.getQueryData(["posts", postId]) as any;
      if (postCache && postCache._count && typeof postCache._count.shares === "number") {
        qc.setQueryData(["posts", postId], { ...postCache, _count: { ...postCache._count, shares: Math.max(0, postCache._count.shares - 1) } });
      }

      return { previous };
    },
    onError: (_err, postId, context: any) => {
      if (context?.previous) qc.setQueryData(["postShareState", postId], context.previous);
    },
    onSettled: (_data, _err, postId) => {
      qc.invalidateQueries({ queryKey: ["postShareState", postId] });
      qc.invalidateQueries({ queryKey: ["posts", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["me", "shares"] });
    },
  });

  return {
    shareMutation,
    unshareMutation,
    share: (postId: string, note?: string) => shareMutation.mutate({ postId, note }),
    unshare: (postId: string) => unshareMutation.mutate(postId),
  };
}
