"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { ConversationDto } from "@/types/conversation.types";

async function fetchConversation(conversationId: string, signal?: AbortSignal) {
  return apiClient<ConversationDto>(`/api/conversations/${encodeURIComponent(conversationId)}`, { credentials: "same-origin" }, signal);
}

async function fetchConversationBetweenUsers(otherUserId: string, signal?: AbortSignal) {
  const params = new URLSearchParams();
  params.set("otherUserId", otherUserId);
  return apiClient<ConversationDto>(`/api/conversations/find?${params.toString()}`, { credentials: "same-origin" }, signal);
}

async function fetchParticipantStatus(conversationId: string, signal?: AbortSignal) {
  return apiClient<{ isParticipant: boolean }>(`/api/conversations/${encodeURIComponent(conversationId)}/participant`, { credentials: "same-origin" }, signal);
}

async function postConversationAction(conversationId: string, action: string) {
  return apiClient<ConversationDto>(`/api/conversations/${encodeURIComponent(conversationId)}/${action}`, { method: "POST", credentials: "same-origin" });
}

async function patchLastReadAt(conversationId: string) {
  return apiClient<{ lastReadAt: string | null }>(`/api/conversations/${encodeURIComponent(conversationId)}/last-read`, { method: "PATCH", credentials: "same-origin" });
}

export type CreateConversationPayload = {
  participantIds: string[];
  txPostId?: string | null;
  txBuyerId?: string | null;
  txSellerId?: string | null;
};

export async function createConversation(payload: CreateConversationPayload) {
  return apiClient<ConversationDto>(`/api/conversations`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      participant_ids: payload.participantIds,
      tx_post_id: payload.txPostId,
      tx_buyer_id: payload.txBuyerId,
      tx_seller_id: payload.txSellerId,
    }),
  });
}

export function useConversation(conversationId?: string) {
  return useQuery<ConversationDto, Error>({
    queryKey: ["conversation", conversationId ?? ""],
    queryFn: ({ signal }) => fetchConversation(conversationId!, signal),
    enabled: Boolean(conversationId),
  });
}

export function useFindConversation(otherUserId?: string) {
  return useQuery<ConversationDto, Error>({
    queryKey: ["conversation", "find", otherUserId ?? ""],
    queryFn: ({ signal }) => fetchConversationBetweenUsers(otherUserId!, signal),
    enabled: Boolean(otherUserId),
  });
}

export function useConversationParticipant(conversationId?: string) {
  return useQuery<{ isParticipant: boolean }, Error>({
    queryKey: ["conversation", conversationId ?? "", "participant"],
    queryFn: ({ signal }) => fetchParticipantStatus(conversationId!, signal),
    enabled: Boolean(conversationId),
  });
}

export function useConversationActions() {
  const queryClient = useQueryClient();

  const createMutation = useMutation<ConversationDto, Error, CreateConversationPayload>({
    mutationFn: createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", "find"] });
    },
  });

  const confirmMutation = useMutation<ConversationDto, Error, string>({
    mutationFn: (conversationId) => postConversationAction(conversationId, "confirm-trade"),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const completeMutation = useMutation<ConversationDto, Error, string>({
    mutationFn: (conversationId) => postConversationAction(conversationId, "complete-trade"),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const cancelMutation = useMutation<ConversationDto, Error, string>({
    mutationFn: (conversationId) => postConversationAction(conversationId, "cancel-trade"),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const adminMutation = useMutation<ConversationDto, Error, string>({
    mutationFn: (conversationId) => postConversationAction(conversationId, "admin-join"),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const lastReadMutation = useMutation<{ lastReadAt: string | null }, Error, string>({
    mutationFn: patchLastReadAt,
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    createConversation: createMutation.mutateAsync,
    confirmTrade: confirmMutation.mutateAsync,
    completeTrade: completeMutation.mutateAsync,
    cancelTrade: cancelMutation.mutateAsync,
    adminJoinTrade: adminMutation.mutateAsync,
    updateLastReadAt: lastReadMutation.mutateAsync,
    isCreating: createMutation.status === "pending",
    isConfirming: confirmMutation.status === "pending",
    isCompleting: completeMutation.status === "pending",
    isCancelling: cancelMutation.status === "pending",
    isAdminJoining: adminMutation.status === "pending",
    isUpdatingLastRead: lastReadMutation.status === "pending",
    createError: createMutation.error,
    confirmError: confirmMutation.error,
    completeError: completeMutation.error,
    cancelError: cancelMutation.error,
    adminError: adminMutation.error,
    lastReadError: lastReadMutation.error,
  };
}
