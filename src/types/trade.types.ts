import type { PublicUser } from "./api.types";
import type { MessageDto } from "./message.types";

export type TradeStatus = "initiated" | "both_confirmed" | "completed" | "cancelled" | null;

export type TradeDto = {
  conversationId: string;
  txPostId: string | null;
  txBuyerId: string | null;
  txSellerId: string | null;
  txStatus: TradeStatus;
  txBuyerConfirmedAt: string | null;
  txSellerConfirmedAt: string | null;
  txAdminId: string | null;
  txAdminJoinedAt: string | null;
  txCompletedAt: string | null;
  txCancelledAt: string | null;
};

export type TradeDetailsDto = {
  conversationId: string;
  participants: PublicUser[];
  latestMessage: MessageDto | null;
  trade: TradeDto | null;
};
