import { prisma } from "@/lib/prisma";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/services/shared/app-error";
import { getConversationRecordById, updateConversationTx } from "@/lib/services/conversations/conversation.repository";
import { mapConversationToDto } from "@/lib/services/conversations/conversation.mapper";
import { createNotifications } from "@/lib/services/notification.service";
import { messageService } from "@/lib/services/messages/message.service";

/**
 * TradeService encapsulates trade-related business rules operating on the conversations aggregate.
 * All state-changing operations use a Prisma transaction to ensure consistency.
 */
export class TradeService {
  /**
   * Start a trade for a conversation. Only a `member` participant may initiate.
   */
  async startTrade(conversationId: string, initiatedByUserId: string) {
    if (!conversationId?.trim()) throw new AppError("conversationId is required", 400, "INVALID_INPUT");
    if (!initiatedByUserId?.trim()) throw new AppError("initiatedByUserId is required", 400, "INVALID_INPUT");

    const conversation = await getConversationRecordById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation not found");

    // Basic eligibility checks
    const participants = conversation.conversation_participants ?? [];
    if (participants.length !== 2) throw new AppError("Trade requires exactly two participants", 400, "INVALID_CONVERSATION");

    const hasMember = participants.some((p: any) => p.users?.role === "member");
    if (!hasMember) throw new ForbiddenError("At least one participant must be a member to start a trade");

    const initiator = participants.find((p: any) => p.user_id === initiatedByUserId);
    if (!initiator) throw new ForbiddenError("User is not part of this conversation");
    if (initiator.users?.role !== "member") throw new ForbiddenError("Only members can initiate a trade");

    if (conversation.tx_status) throw new AppError("Trade already started or in invalid state", 400, "INVALID_TRADE_STATE");

    const buyerId = initiatedByUserId;
    const sellerId = participants.find((p: any) => p.user_id !== buyerId)!.user_id;

    // Determine related marketplace post: prefer existing tx_post_id otherwise try to find seller's latest marketplace post
    let postId = conversation.tx_post_id;
    if (!postId) {
      const post = await prisma.posts.findFirst({
        where: { user_id: sellerId, post_type: "marketplace", status: "active" },
        orderBy: { updated_at: "desc" },
        select: { id: true },
      });
      if (!post) throw new AppError("No marketplace post found for seller", 400, "NO_POST");
      postId = post.id;
    }

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await updateConversationTx(tx, conversationId, {
        tx_status: "initiated",
        tx_post_id: postId,
        tx_buyer_id: buyerId,
        tx_seller_id: sellerId,
        updated_at: now,
      });

      // notify all admins so they can join if needed
      const admins = await tx.users.findMany({ where: { role: "admin" }, select: { id: true } });
      if (admins.length) {
        const entries = admins.map((a: any) => ({
          userId: a.id,
          type: "tx_admin_joined" as any,
          title: "Trade initiated",
          body: "A trade has been started and requires admin attention.",
          data: { conversationId },
        }));

        await createNotifications(tx, entries, { actorId: buyerId });
      }

      // add a system message to the chat
      await messageService.createSystemMessageTx(tx, conversationId, buyerId, "Trade initiated.");
    });

    return mapConversationToDto(await getConversationRecordById(conversationId));
  }

  /**
   * Admin joins an initiated trade. Admin must have role `admin`.
   */
  async joinTrade(conversationId: string, adminUserId: string) {
    if (!conversationId?.trim()) throw new AppError("conversationId is required", 400, "INVALID_INPUT");
    if (!adminUserId?.trim()) throw new AppError("adminUserId is required", 400, "INVALID_INPUT");

    const admin = await prisma.users.findUnique({ where: { id: adminUserId } });
    if (!admin) throw new NotFoundError("Admin user not found");
    if (admin.role !== "admin") throw new ForbiddenError("Only admins can join trades");

    const conversation = await getConversationRecordById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation not found");
    if (conversation.tx_status !== "initiated") throw new AppError("Trade must be in initiated state to join", 400, "INVALID_TRADE_STATE");

    await prisma.$transaction(async (tx) => {
      // ensure admin is a participant
      await tx.conversation_participants.createMany({ data: [{ conversation_id: conversationId, user_id: adminUserId }], skipDuplicates: true });

      const now = new Date();
      await updateConversationTx(tx, conversationId, { tx_admin_id: adminUserId, tx_admin_joined_at: now, updated_at: now });

      const recipientIds = [conversation.tx_buyer_id, conversation.tx_seller_id].filter(Boolean) as string[];
      const entries = recipientIds.map((userId) => ({
        userId,
        type: "tx_admin_joined" as any,
        title: "Admin joined the trade",
        body: "A moderator has joined the conversation to help with the transaction.",
        data: { conversationId },
      }));

      if (entries.length) await createNotifications(tx, entries, { actorId: adminUserId });

      await messageService.createSystemMessageTx(tx, conversationId, adminUserId, "Admin has joined the trade.");
    });

    return mapConversationToDto(await getConversationRecordById(conversationId));
  }

  /**
   * Complete a trade. Only the admin who joined the trade may complete it.
   */
  async completeTrade(conversationId: string, adminUserId: string) {
    if (!conversationId?.trim()) throw new AppError("conversationId is required", 400, "INVALID_INPUT");
    if (!adminUserId?.trim()) throw new AppError("adminUserId is required", 400, "INVALID_INPUT");

    const admin = await prisma.users.findUnique({ where: { id: adminUserId } });
    if (!admin) throw new NotFoundError("Admin user not found");
    if (admin.role !== "admin") throw new ForbiddenError("Only admins can complete trades");

    const conversation = await getConversationRecordById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation not found");
    if (conversation.tx_status === "completed" || conversation.tx_status === "cancelled") throw new AppError("Trade cannot be completed in its current state", 400, "INVALID_TRADE_STATE");
    if (conversation.tx_admin_id !== adminUserId) throw new ForbiddenError("Admin does not own this trade");

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await updateConversationTx(tx, conversationId, { tx_status: "completed", tx_completed_at: now, updated_at: now });

      const recipientIds = [conversation.tx_buyer_id, conversation.tx_seller_id].filter(Boolean) as string[];
      const entries = recipientIds.map((userId) => ({
        userId,
        type: "tx_completed" as any,
        title: "Trade completed",
        body: "Trade completed successfully.",
        data: { conversationId },
      }));

      if (entries.length) await createNotifications(tx, entries, { actorId: adminUserId });

      await messageService.createSystemMessageTx(tx, conversationId, adminUserId, "Trade completed by admin.");
    });

    return mapConversationToDto(await getConversationRecordById(conversationId));
  }

  /**
   * Cancel a trade. Only the admin who owns the trade may cancel it.
   */
  async cancelTrade(conversationId: string, adminUserId: string, reason?: string) {
    if (!conversationId?.trim()) throw new AppError("conversationId is required", 400, "INVALID_INPUT");
    if (!adminUserId?.trim()) throw new AppError("adminUserId is required", 400, "INVALID_INPUT");

    const admin = await prisma.users.findUnique({ where: { id: adminUserId } });
    if (!admin) throw new NotFoundError("Admin user not found");
    if (admin.role !== "admin") throw new ForbiddenError("Only admins can cancel trades");

    const conversation = await getConversationRecordById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation not found");
    if (conversation.tx_status === "completed" || conversation.tx_status === "cancelled") throw new AppError("Trade cannot be cancelled in its current state", 400, "INVALID_TRADE_STATE");
    if (conversation.tx_admin_id !== adminUserId) throw new ForbiddenError("Admin does not own this trade");

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await updateConversationTx(tx, conversationId, { tx_status: "cancelled", tx_cancelled_at: now, updated_at: now });

      const recipientIds = [conversation.tx_buyer_id, conversation.tx_seller_id].filter(Boolean) as string[];
      const entries = recipientIds.map((userId) => ({
        userId,
        type: "tx_cancelled" as any,
        title: "Trade cancelled",
        body: reason ? `Trade cancelled by admin. Reason: ${reason}` : "Trade cancelled by admin.",
        data: { conversationId },
      }));

      if (entries.length) await createNotifications(tx, entries, { actorId: adminUserId });

      await messageService.createSystemMessageTx(tx, conversationId, adminUserId, "Trade cancelled by admin.");
    });

    return mapConversationToDto(await getConversationRecordById(conversationId));
  }

  /**
   * Return trade details (conversation DTO) for a conversation id.
   */
  async getTradeDetails(conversationId: string) {
    const conversation = await getConversationRecordById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation not found");
    return mapConversationToDto(conversation);
  }

  /**
   * Check whether the given user may start a trade on the conversation.
   */
  async canStartTrade(conversationId: string, userId: string) {
    if (!conversationId?.trim() || !userId?.trim()) return false;
    const conversation = await getConversationRecordById(conversationId);
    if (!conversation) return false;
    const participants = conversation.conversation_participants ?? [];
    if (participants.length !== 2) return false;
    const hasMember = participants.some((p: any) => p.users?.role === "member");
    if (!hasMember) return false;
    const initiator = participants.find((p: any) => p.user_id === userId);
    if (!initiator) return false;
    return initiator.users?.role === "member" && !conversation.tx_status;
  }

  /**
   * Check whether the given user may manage (join/complete/cancel) the trade.
   * For this implementation, only an admin who is recorded as tx_admin_id may manage the trade.
   */
  async canManageTrade(conversationId: string, userId: string) {
    if (!conversationId?.trim() || !userId?.trim()) return false;
    const conversation = await getConversationRecordById(conversationId);
    if (!conversation) return false;
    return conversation.tx_admin_id === userId;
  }
}

export const tradeService = new TradeService();

export default tradeService;
