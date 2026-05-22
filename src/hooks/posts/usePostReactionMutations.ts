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
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["postReactions", variables.postId] });
      qc.invalidateQueries({ queryKey: ["posts", variables.postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const removeMutation = useMutation<any, Error, string>({
    mutationFn: (postId) => deleteReactApi(postId),
    onSuccess: (_data, postId) => {
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
