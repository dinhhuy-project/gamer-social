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

  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

async function postAction(path: string, body: Record<string, any>) {
  const res = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return parseResponse<ConversationDto>(res, "Failed to perform action");
}

export function useStartTrade() {
  const qc = useQueryClient();
  return useMutation<ConversationDto, Error, string>({
    mutationFn: (conversationId) => postAction(`/api/trades/start`, { conversationId }),
    onSuccess: (_data, conversationId) => {
      qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useJoinTrade() {
  const qc = useQueryClient();
  return useMutation<ConversationDto, Error, string>({
    mutationFn: (conversationId) => postAction(`/api/trades/join`, { conversationId }),
    onSuccess: (_data, conversationId) => {
      qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useCompleteTrade() {
  const qc = useQueryClient();
  return useMutation<ConversationDto, Error, string>({
    mutationFn: (conversationId) => postAction(`/api/trades/complete`, { conversationId }),
    onSuccess: (_data, conversationId) => {
      qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useCancelTrade() {
  const qc = useQueryClient();
  return useMutation<ConversationDto, Error, { conversationId: string; reason?: string }>({
    mutationFn: ({ conversationId, reason }) => postAction(`/api/trades/cancel`, { conversationId, reason }),
    onSuccess: (_data, vars) => {
      const conversationId = typeof vars === "string" ? vars : vars.conversationId;
      qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useTrade(conversationId?: string) {
  return useQuery<ConversationDto, Error>({
    queryKey: ["conversation", conversationId ?? ""],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId ?? "")}`, { credentials: "same-origin" });
      return parseResponse<ConversationDto>(res, "Failed to load trade");
    },
    enabled: Boolean(conversationId),
  });
}
