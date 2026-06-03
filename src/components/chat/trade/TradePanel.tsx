"use client";

import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardAction } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ConversationDto } from "@/types/conversation.types";
import { useTrade } from "@/hooks/trades";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import TradeStatusBadge from "./TradeStatusBadge";
import StartTradeButton from "./StartTradeButton";
import TradeParticipantsCard from "./TradeParticipantsCard";
import TradeAdminControls from "./TradeAdminControls";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  conversationId: string;
};

export function TradePanel({ conversationId }: Props) {
  const query = useTrade(conversationId);
  const { data: currentUser } = useCurrentUser();

  const conversation = query.data;
  const isLoading = query.isLoading;
  const trade = conversation?.trade;

  // UI-level canStartTrade: require two participants and current user is a member participant
  const canStartTrade = (() => {
    if (!conversation || !currentUser) return false;
    if ((conversation.participants ?? []).length !== 2) return false;
    const participantRoles = conversation.participants.map((p) => p.role);
    if (!participantRoles.includes("member")) return false;
    const isParticipant = conversation.participants.some((p) => p.id === currentUser.id);
    if (!isParticipant) return false;
    return currentUser.role === "member";
  })();

  if (isLoading) {
    return (
      <div className="p-2">
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="p-2">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Trade
            <span className="ml-2">
              <TradeStatusBadge status={trade?.txStatus ?? null} />
            </span>
          </CardTitle>
          <CardAction>
            {/* Actions: Start or admin controls */}
            {!trade ? (canStartTrade ? <StartTradeButton conversationId={conversationId} /> : null) : null}
          </CardAction>
        </CardHeader>

        <CardContent>
          {!trade ? (
            <div className="text-sm text-muted-foreground">No trade started.</div>
          ) : (
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium">{trade.txStatus === "initiated" ? "Trade started" : trade.txStatus === "completed" ? "Trade completed" : trade.txStatus === "cancelled" ? "Trade cancelled" : "Trade"}</div>
                <div className="text-xs text-muted-foreground">{trade.txAdminId ? `Admin: ${conversation.participants.find((p) => p.id === trade.txAdminId)?.displayName ?? conversation.participants.find((p) => p.id === trade.txAdminId)?.username}` : "Waiting for admin..."}</div>
              </div>

              <div className="mt-2 md:mt-0 flex items-center gap-2">
                <TradeParticipantsCard conversation={conversation} />
                <TradeAdminControls conversation={conversation} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-2"><Separator /></div>
    </div>
  );
}

export default TradePanel;
