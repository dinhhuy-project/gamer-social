"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { MessageDto } from "@/types/message.types";
import { useAuth } from "@/providers/AuthProvider";

type Props = {
  message: MessageDto;
};

export function MessageBubble({ message }: Props) {
  const { profile } = useAuth();
  const isMine = profile?.id === message.senderId;

  return (
    <div className={`flex gap-3 ${isMine ? "justify-end" : "justify-start"}`}>
      {!isMine && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{message.senderId?.[0] ?? "U"}</AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className={`max-w-[75%] rounded-xl px-3 py-2 ${isMine ? "bg-orange-500 text-black" : "bg-zinc-800 text-white"}`}>
        {message.content ? <div className="whitespace-pre-wrap">{message.content}</div> : <div className="italic text-zinc-400">(attachment)</div>}
        <div className="mt-1 text-[10px] text-zinc-500 text-right">{new Date(message.sentAt).toLocaleTimeString()}</div>
      </div>

      {isMine && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{profile?.displayName?.[0] ?? profile?.username?.[0] ?? "U"}</AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
