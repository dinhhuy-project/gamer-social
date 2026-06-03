"use client";

import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import type { ConversationDto } from "@/types/conversation.types";

type Props = {
  conversation: ConversationDto;
};

export function TradeParticipantsCard({ conversation }: Props) {
  const trade = conversation.trade;

  const find = (id: string | null | undefined) => conversation.participants.find((p) => p.id === id);

  const buyer = find(trade?.txBuyerId ?? null);
  const seller = find(trade?.txSellerId ?? null);
  const admin = find(trade?.txAdminId ?? null);

  return (
    <Card size="sm" className="w-full">
      <CardHeader>
        <CardTitle>Participants</CardTitle>
        <CardDescription className="text-xs">Buyer · Seller · Admin</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Buyer</div>
            <div className="font-medium">{buyer ? buyer.displayName ?? buyer.username : "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Seller</div>
            <div className="font-medium">{seller ? seller.displayName ?? seller.username : "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Admin</div>
            <div className="font-medium">{admin ? admin.displayName ?? admin.username : "—"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TradeParticipantsCard;
