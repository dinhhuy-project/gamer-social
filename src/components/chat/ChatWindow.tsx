"use client";

import React, { useEffect, useRef } from "react";
import { useConversation } from "@/hooks/chat/useConversation";
import { useRealtimeMessages } from "@/hooks/chat/useRealtimeMessages";
import { useMarkConversationRead } from "@/hooks/messages/useMarkConversationRead";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TradePanel from "./trade/TradePanel";
import { useAuth } from "@/providers/AuthProvider";

type Props = {
  conversationId?: string;
};

export function ChatWindow({ conversationId }: Props) {
  const { data: convo } = useConversation(conversationId);
  const { messages, sendMessage } = useRealtimeMessages(conversationId, 1, 200);
  const { markConversationRead } = useMarkConversationRead();
  const { profile } = useAuth();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    // mark read on open
    void markConversationRead(conversationId);
  }, [conversationId, markConversationRead]);

  useEffect(() => {
    // scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSend = async (content: string) => {
    if (!conversationId) return;
    await sendMessage(content);
  };

  if (!conversationId) {
    return <div className="flex h-full items-center justify-center text-zinc-500">Select a conversation to start chatting</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-800 p-3">
        <div className="text-sm font-semibold text-white">{convo?.participants?.map((p) => p.displayName ?? p.username).join(", ")}</div>
        <div className="text-xs text-zinc-400">{convo?.trade ? "Trade conversation" : ""}</div>
        <div className="mt-2">
          <TradePanel conversationId={conversationId!} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages?.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-zinc-800">
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
}

export default ChatWindow;
