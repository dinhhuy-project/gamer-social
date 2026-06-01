import type { PublicUser } from "./api.types";
import type { MessageDto } from "./message.types";

export type TradeMetadataDto = {
  txPostId: string | null;
  txBuyerId: string | null;
  txSellerId: string | null;
  txStatus: "initiated" | "both_confirmed" | "completed" | "cancelled" | null;
  txBuyerConfirmedAt: string | null;
  txSellerConfirmedAt: string | null;
  txAdminId: string | null;
  txAdminJoinedAt: string | null;
  txCompletedAt: string | null;
  txCancelledAt: string | null;
};

export type ConversationDto = {
  id: string;
  participants: PublicUser[];
  latestMessage: MessageDto | null;
  updatedAt: string;
  trade?: TradeMetadataDto;
};
