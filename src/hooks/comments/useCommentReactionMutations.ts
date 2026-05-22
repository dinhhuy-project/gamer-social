"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

async function commentReactApi(commentId: string, type: string) {
  const res = await fetch(`/api/comments/${encodeURIComponent(commentId)}/reactions`, {
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
    throw new Error(msg || "Failed to react to comment");
  }

  return await res.json();
}

async function deleteCommentReactApi(commentId: string) {
  const res = await fetch(`/api/comments/${encodeURIComponent(commentId)}/reactions`, {
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

export function useCommentReactionMutations() {
  const qc = useQueryClient();

  const reactMutation = useMutation<any, Error, { commentId: string; type: string }>({
    mutationFn: ({ commentId, type }) => commentReactApi(commentId, type),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["commentReactions", variables.commentId] });
      qc.invalidateQueries({ queryKey: ["comment", variables.commentId] });
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const removeMutation = useMutation<any, Error, string>({
    mutationFn: (commentId) => deleteCommentReactApi(commentId),
    onSuccess: (_data, commentId) => {
      qc.invalidateQueries({ queryKey: ["commentReactions", commentId] });
      qc.invalidateQueries({ queryKey: ["comment", commentId] });
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    reactMutation,
    removeMutation,
    react: (commentId: string, type: string) => reactMutation.mutate({ commentId, type }),
    remove: (commentId: string) => removeMutation.mutate(commentId),
  };
}
