"use client";

import { useQuery, keepPreviousData, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { PaginatedResponse, CommentDTO } from "@/types/api.types";

async function fetchComments(
  postId: string,
  page = 1,
  perPage = 20,
  repliesPerRoot = 3,
  signal?: AbortSignal
) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  params.set("repliesPerRoot", String(repliesPerRoot));
  return apiClient<PaginatedResponse<CommentDTO>>(`/api/posts/${encodeURIComponent(postId)}/comments?${params.toString()}`, { credentials: "same-origin" }, signal);
}

async function fetchCommentTree(postId: string, signal?: AbortSignal) {
  return apiClient<CommentDTO[]>(`/api/posts/${encodeURIComponent(postId)}/comments?tree=true`, { credentials: "same-origin" }, signal);
}

async function fetchComment(commentId: string, signal?: AbortSignal) {
  return apiClient<CommentDTO>(`/api/comments/${encodeURIComponent(commentId)}`, { credentials: "same-origin" }, signal);
}

async function createComment(postId: string, input: { content: string; parentId?: string }) {
  return apiClient<CommentDTO>(`/api/posts/${encodeURIComponent(postId)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
}

async function updateComment(commentId: string, input: { content: string }) {
  return apiClient<CommentDTO>(`/api/comments/${encodeURIComponent(commentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
}

async function deleteComment(commentId: string) {
  return apiClient<CommentDTO>(`/api/comments/${encodeURIComponent(commentId)}`, { method: "DELETE", credentials: "same-origin" });
}

export function useComments(postId: string, page = 1, perPage = 20, repliesPerRoot = 3) {
  return useQuery<PaginatedResponse<CommentDTO>, Error>({
    queryKey: ["comments", postId, page, perPage, repliesPerRoot],
    queryFn: ({ signal }) => fetchComments(postId, page, perPage, repliesPerRoot, signal),
    placeholderData: keepPreviousData,
    enabled: Boolean(postId),
  });
}

export function useCommentTree(postId: string) {
  return useQuery<CommentDTO[], Error>({
    queryKey: ["commentTree", postId],
    queryFn: ({ signal }) => fetchCommentTree(postId, signal),
    enabled: Boolean(postId),
  });
}

export function useComment(commentId: string, initialData?: CommentDTO) {
  return useQuery<CommentDTO, Error>({
    queryKey: ["comment", commentId],
    queryFn: ({ signal }) => fetchComment(commentId, signal),
    enabled: Boolean(commentId),
    initialData,
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
