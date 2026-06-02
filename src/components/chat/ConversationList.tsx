"use client";

import React from "react";
import { useConversations } from "@/hooks/chat/useConversations";
import ConversationItem from "./ConversationItem";
import { useMessagesRealtime } from "@/hooks/chat/useMessagesRealtime";

export function ConversationList() {
  const { data, isLoading, error } = useConversations(1, 50);

  // mount global messages realtime when the list is visible
  useMessagesRealtime();

  if (isLoading) return <div className="p-4 text-zinc-400">Loading conversations...</div>;
  if (error) return <div className="p-4 text-red-400">Failed to load conversations</div>;

  return (
    <div className="h-full overflow-y-auto">
      <div className="divide-y divide-zinc-800">
        {data?.data?.map((c) => (
          <div key={c.id}>
            <ConversationItem conversation={c} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConversationList;
