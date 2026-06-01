"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConversationDto } from "@/types/conversation.types";

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const text = await response.text();

  if (!response.ok) {
    let error = fallbackMessage;
    try {
      const payload = JSON.parse(text);
      if (payload?.error) {
        error = payload.error;
      }
    } catch {
      // ignore invalid JSON
    }
    throw new Error(error);
  }

  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

async function fetchConversation(conversationId: string) {
  const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
    credentials: "same-origin",
  });

  return parseResponse<ConversationDto>(res, "Failed to load conversation");
}

async function fetchConversationBetweenUsers(otherUserId: string) {
  const params = new URLSearchParams();
  params.set("otherUserId", otherUserId);

  const res = await fetch(`/api/conversations/find?${params.toString()}`, {
    credentials: "same-origin",
  });

  return parseResponse<ConversationDto>(res, "Failed to find conversation");
}

async function fetchParticipantStatus(conversationId: string) {
  const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/participant`, {
    credentials: "same-origin",
  });

  return parseResponse<{ isParticipant: boolean }>(res, "Failed to check participant status");
}

async function postConversationAction(conversationId: string, action: string) {
  const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/${action}`, {
    method: "POST",
    credentials: "same-origin",
  });

  return parseResponse<ConversationDto>(res, `Failed to execute ${action} action`);
}

async function patchLastReadAt(conversationId: string) {
  const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/last-read`, {
    method: "PATCH",
    credentials: "same-origin",
  });

  return parseResponse<{ lastReadAt: string | null }>(res, "Failed to update last read status");
}

export type CreateConversationPayload = {
  participantIds: string[];
  txPostId?: string | null;
  txBuyerId?: string | null;
  txSellerId?: string | null;
};

export async function createConversation(payload: CreateConversationPayload) {
  const res = await fetch(`/api/conversations`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      participant_ids: payload.participantIds,
      tx_post_id: payload.txPostId,
      tx_buyer_id: payload.txBuyerId,
      tx_seller_id: payload.txSellerId,
    }),
  });

  return parseResponse<ConversationDto>(res, "Failed to create conversation");
}

export function useConversation(conversationId?: string) {
  return useQuery<ConversationDto, Error>({
    queryKey: ["conversation", conversationId ?? ""],
    queryFn: () => fetchConversation(conversationId!),
    enabled: Boolean(conversationId),
  });
}

export function useFindConversation(otherUserId?: string) {
  return useQuery<ConversationDto, Error>({
    queryKey: ["conversation", "find", otherUserId ?? ""],
    queryFn: () => fetchConversationBetweenUsers(otherUserId!),
    enabled: Boolean(otherUserId),
  });
}

export function useConversationParticipant(conversationId?: string) {
  return useQuery<{ isParticipant: boolean }, Error>({
    queryKey: ["conversation", conversationId ?? "", "participant"],
    queryFn: () => fetchParticipantStatus(conversationId!),
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
