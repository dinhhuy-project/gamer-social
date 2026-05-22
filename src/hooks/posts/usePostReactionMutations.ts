"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

async function postReactApi(postId: string, type: string) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/reactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ type }),
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to react to post");
  }

  return await res.json();
}

async function deleteReactApi(postId: string) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/reactions`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to remove reaction");
  }

  return await res.json();
}

export function usePostReactionMutations() {
  const qc = useQueryClient();

  const reactMutation = useMutation<any, Error, { postId: string; type: string }>({
    mutationFn: ({ postId, type }) => postReactApi(postId, type),
    // optimistic update: update cached reaction summary and post counts
    onMutate: async ({ postId, type }) => {
      await qc.cancelQueries({ queryKey: ["postReactions", postId] });
      const previous = qc.getQueryData(["postReactions", postId]);

      qc.setQueryData(["postReactions", postId], (old: any) => {
        if (!old) return old;
        const next = { ...old };
        // increment specific reaction and total
        if (next.counts && typeof next.counts[type] === "number") next.counts[type] = next.counts[type] + 1;
        if (next.counts && typeof next.counts.total === "number") next.counts.total = next.counts.total + 1;
        next.viewerReaction = type;
        return next;
      });

      // optimistic update for single post cache
      const postCache = qc.getQueryData(["posts", postId]) as any;
      if (postCache && postCache._count && typeof postCache._count.reactions === "number") {
        qc.setQueryData(["posts", postId], { ...postCache, _count: { ...postCache._count, reactions: postCache._count.reactions + 1 } });
      }

      return { previous };
    },
    onError: (_err, variables, context: any) => {
      if (context?.previous) qc.setQueryData(["postReactions", variables.postId], context.previous);
    },
    onSettled: (_data, _err, variables) => {
      qc.invalidateQueries({ queryKey: ["postReactions", variables.postId] });
      qc.invalidateQueries({ queryKey: ["posts", variables.postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const removeMutation = useMutation<any, Error, string>({
    mutationFn: (postId) => deleteReactApi(postId),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ["postReactions", postId] });
      const previous = qc.getQueryData(["postReactions", postId]);

      qc.setQueryData(["postReactions", postId], (old: any) => {
        if (!old) return old;
        const next = { ...old };
        // decrement like (best-effort) and total
        // prefer to decrement the viewerReaction slot
        if (next.viewerReaction) {
          const t = next.viewerReaction;
          if (next.counts && typeof next.counts[t] === "number") next.counts[t] = Math.max(0, next.counts[t] - 1);
        }
        if (next.counts && typeof next.counts.total === "number") next.counts.total = Math.max(0, next.counts.total - 1);
        next.viewerReaction = null;
        return next;
      });

      const postCache = qc.getQueryData(["posts", postId]) as any;
      if (postCache && postCache._count && typeof postCache._count.reactions === "number") {
        qc.setQueryData(["posts", postId], { ...postCache, _count: { ...postCache._count, reactions: Math.max(0, postCache._count.reactions - 1) } });
      }

      return { previous };
    },
    onError: (_err, postId, context: any) => {
      if (context?.previous) qc.setQueryData(["postReactions", postId], context.previous);
    },
    onSettled: (_data, _err, postId) => {
      qc.invalidateQueries({ queryKey: ["postReactions", postId] });
      qc.invalidateQueries({ queryKey: ["posts", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    reactMutation,
    removeMutation,
    react: (postId: string, type: string) => reactMutation.mutate({ postId, type }),
    remove: (postId: string) => removeMutation.mutate(postId),
  };
}
