"use client";

import { useQuery, keepPreviousData, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResponse, CommentDTO } from "@/types/api.types";

async function fetchComments(
  postId: string,
  page = 1,
  perPage = 20,
  repliesPerRoot = 3
) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  params.set("repliesPerRoot", String(repliesPerRoot));

  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments?${params.toString()}`, {
    credentials: "same-origin",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch comments");
  }

  return (await res.json()) as PaginatedResponse<CommentDTO>;
}

async function fetchCommentTree(postId: string) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments?tree=true`, {
    credentials: "same-origin",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch comment tree");
  }

  return (await res.json()) as CommentDTO[];
}

async function fetchComment(commentId: string) {
  const res = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
    credentials: "same-origin",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch comment");
  }

  return (await res.json()) as CommentDTO;
}

async function createComment(postId: string, input: { content: string; parentId?: string }) {
  const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to create comment");
  }

  return (await res.json()) as CommentDTO;
}

async function updateComment(commentId: string, input: { content: string }) {
  const res = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to update comment");
  }

  return (await res.json()) as CommentDTO;
}

async function deleteComment(commentId: string) {
  const res = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to delete comment");
  }

  return (await res.json()) as CommentDTO;
}

export function useComments(postId: string, page = 1, perPage = 20, repliesPerRoot = 3) {
  return useQuery<PaginatedResponse<CommentDTO>, Error>({
    queryKey: ["comments", postId, page, perPage, repliesPerRoot],
    queryFn: () => fetchComments(postId, page, perPage, repliesPerRoot),
    placeholderData: keepPreviousData,
    enabled: Boolean(postId),
  });
}

export function useCommentTree(postId: string) {
  return useQuery<CommentDTO[], Error>({
    queryKey: ["commentTree", postId],
    queryFn: () => fetchCommentTree(postId),
    enabled: Boolean(postId),
  });
}

export function useComment(commentId: string) {
  return useQuery<CommentDTO, Error>({
    queryKey: ["comment", commentId],
    queryFn: () => fetchComment(commentId),
    enabled: Boolean(commentId),
  });
}

export function useCommentMutations() {
  const qc = useQueryClient();

  const createMutation = useMutation<CommentDTO, Error, { postId: string; input: { content: string; parentId?: string } }>({
    mutationFn: ({ postId, input }) => createComment(postId, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["comments", variables.postId] });
      qc.invalidateQueries({ queryKey: ["commentTree", variables.postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const updateMutation = useMutation<CommentDTO, Error, { commentId: string; input: { content: string } }>({
    mutationFn: ({ commentId, input }) => updateComment(commentId, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["comment", variables.commentId] });
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["commentTree"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const deleteMutation = useMutation<CommentDTO, Error, { commentId: string; postId: string }>({
    mutationFn: ({ commentId }) => deleteComment(commentId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["comment", variables.commentId] });
      qc.invalidateQueries({ queryKey: ["comments", variables.postId] });
      qc.invalidateQueries({ queryKey: ["commentTree", variables.postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    create: (postId: string, input: { content: string; parentId?: string }) => createMutation.mutate({ postId, input }),
    update: (commentId: string, input: { content: string }) => updateMutation.mutate({ commentId, input }),
    remove: (commentId: string, postId: string) => deleteMutation.mutate({ commentId, postId }),
  };
}
