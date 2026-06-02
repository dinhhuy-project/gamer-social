"use client";

import Link from "next/link";
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/providers/AuthProvider";
import { useUnreadConversationCount } from "@/hooks/messages/useUnreadConversationCount";
import type { ConversationDto } from "@/types/conversation.types";

type Props = {
  conversation: ConversationDto;
  selected?: boolean;
};

export function ConversationItem({ conversation, selected }: Props) {
  const { profile } = useAuth();
  const other = (conversation.participants || []).find((p) => p.id !== profile?.id) ?? conversation.participants?.[0];
  const { data: unread } = useUnreadConversationCount(conversation.id);

  const title = other?.displayName ?? other?.username ?? "Conversation";
  const snippet = conversation.latestMessage?.content ?? "";

  return (
    <Link href={`/messages/${conversation.id}`} className={`flex items-center gap-3 p-3 hover:bg-zinc-900 ${selected ? "bg-zinc-900" : ""}`}>
      <div className="flex-shrink-0">
        <Avatar className="h-11 w-11">
          {other?.avatarUrl ? <AvatarImage src={other.avatarUrl} /> : <AvatarFallback>{(other?.displayName ?? other?.username ?? "U")[0]}</AvatarFallback>}
        </Avatar>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white truncate">{title}</div>
          {unread ? <span className="ml-2 inline-flex items-center rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-black">{unread}</span> : null}
        </div>
        <div className="mt-1 text-xs text-zinc-400 truncate">{snippet}</div>
      </div>
    </Link>
  );
}

export default ConversationItem;
