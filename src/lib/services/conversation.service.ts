import { prisma } from "@/lib/prisma";
import { authService } from "./auth.service";
import { broadcastNotifications, createNotifications } from "@/lib/services";
import { AppError, ForbiddenError, NotFoundError } from "./shared/app-error";
import { assertAuth } from "./shared/assert";
import type { ConversationDto } from "@/types/conversation.types";
import type { MessageDto } from "@/types/message.types";
import type { PublicUser } from "@/types/api.types";

type TradeStatus = "initiated" | "both_confirmed" | "completed" | "cancelled";

type CreateConversationOptions = {
  participantIds: string[];
  txPostId?: string | null;
  txBuyerId?: string | null;
  txSellerId?: string | null;
};

function toPublicUser(user: any): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name ?? null,
    avatarUrl: user.avatar_url ?? null,
    role: user.role,
  };
}

function mapMessageRecordToDto(message: any): MessageDto {
  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    content: message.content ?? null,
    mediaUrls: message.media_urls ?? [],
    sentAt: message.sent_at.toISOString(),
  };
}

function mapConversationToDto(conversation: any): ConversationDto {
  const trade = conversation.tx_post_id
    ? {
      txPostId: conversation.tx_post_id,
      txBuyerId: conversation.tx_buyer_id,
      txSellerId: conversation.tx_seller_id,
      txStatus: conversation.tx_status as TradeStatus | null,
      txBuyerConfirmedAt: conversation.tx_buyer_confirmed_at
        ? conversation.tx_buyer_confirmed_at.toISOString()
        : null,
      txSellerConfirmedAt: conversation.tx_seller_confirmed_at
        ? conversation.tx_seller_confirmed_at.toISOString()
        : null,
      txAdminId: conversation.tx_admin_id,
      txAdminJoinedAt: conversation.tx_admin_joined_at
        ? conversation.tx_admin_joined_at.toISOString()
        : null,
      txCompletedAt: conversation.tx_completed_at
        ? conversation.tx_completed_at.toISOString()
        : null,
      txCancelledAt: conversation.tx_cancelled_at
        ? conversation.tx_cancelled_at.toISOString()
        : null,
    }
    : undefined;

  return {
    id: conversation.id,
    participants: conversation.conversation_participants.map((part: any) =>
      toPublicUser(part.users)
    ),
    latestMessage: conversation.messages?.[0]
      ? mapMessageRecordToDto(conversation.messages[0])
      : null,
    updatedAt: conversation.updated_at.toISOString(),
    trade,
  };
}

function normalizeParticipantIds(participantIds: string[], actorId: string) {
  const uniqueIds = Array.from(
    new Set(
      participantIds
        .map((id) => id?.trim())
        .filter((id): id is string => Boolean(id))
    )
  );

  if (!uniqueIds.includes(actorId)) {
    uniqueIds.push(actorId);
  }

  return uniqueIds;
}

async function getConversationRecord(
  userId: string,
  conversationId: string
) {
  assertAuth(userId);

  return prisma.conversations.findFirst({
    where: {
      id: conversationId,
      conversation_participants: {
        some: {
          user_id: userId,
        },
      },
    },
    include: {
      conversation_participants: {
        include: {
          users: true,
        },
      },
      messages: {
        take: 1,
        orderBy: { sent_at: "desc" },
      },
    },
  });
}

async function getConversationRecordById(conversationId: string) {
  return prisma.conversations.findUnique({
    where: { id: conversationId },
    include: {
      conversation_participants: {
        include: {
          users: true,
        },
      },
      messages: {
        take: 1,
        orderBy: { sent_at: "desc" },
      },
    },
  });
}

export async function listConversations(
  userId: string,
  page = 1,
  perPage = 20
) {
  assertAuth(userId);

  const take = Math.max(1, Math.min(100, perPage));
  const skip = Math.max(0, (page - 1) * take);

  const [total, conversations] = await prisma.$transaction([
    prisma.conversation_participants.count({ where: { user_id: userId } }),
    prisma.conversations.findMany({
      where: {
        conversation_participants: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        conversation_participants: {
          include: {
            users: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { sent_at: "desc" },
        },
      },
      orderBy: { updated_at: "desc" },
      skip,
      take,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));

  return {
    data: conversations.map(mapConversationToDto),
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

export async function getConversation(
  userId: string,
  conversationId: string
) {
  const conversation = await getConversationRecord(userId, conversationId);
  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }
  return mapConversationToDto(conversation);
}

export async function getConversationDetail(
  userId: string,
  conversationId: string
) {
  return getConversation(userId, conversationId);
}

export async function findConversationBetweenUsers(
  userId: string,
  otherUserId: string
) {
  assertAuth(userId);
  if (!otherUserId?.trim()) {
    throw new AppError("Other user id is required", 400, "INVALID_INPUT");
  }
  if (userId === otherUserId) {
    throw new AppError("Cannot search conversation with self", 400, "INVALID_INPUT");
  }

  const conversation = await prisma.conversations.findFirst({
    where: {
      AND: [
        {
          conversation_participants: {
            some: {
              user_id: userId,
            },
          },
        },
        {
          conversation_participants: {
            some: {
              user_id: otherUserId,
            },
          },
        },
        {
          conversation_participants: {
            every: {
              user_id: {
                in: [userId, otherUserId],
              },
            },
          },
        },
      ],
    },
    include: {
      conversation_participants: {
        include: {
          users: true,
        },
      },
      messages: {
        take: 1,
        orderBy: { sent_at: "desc" },
      },
    },
  });

  return conversation ? mapConversationToDto(conversation) : null;
}

export async function createConversation(
  actorId: string | null | undefined,
  options: CreateConversationOptions
) {
  assertAuth(actorId);
  const userId = actorId!.trim();

  const participantIds = normalizeParticipantIds(options.participantIds, userId);
  if (participantIds.length < 2) {
    throw new AppError("At least two participants are required", 400, "INVALID_INPUT");
  }

  const tradePayload: Record<string, any> = {};
  if (options.txPostId) {
    if (!options.txBuyerId || !options.txSellerId) {
      throw new AppError(
        "Trade conversations require buyer and seller ids",
        400,
        "INVALID_INPUT"
      );
    }
    if (!participantIds.includes(options.txBuyerId) || !participantIds.includes(options.txSellerId)) {
      throw new AppError(
        "Buyer and seller must be participants of the conversation",
        400,
        "INVALID_INPUT"
      );
    }

    tradePayload.tx_post_id = options.txPostId;
    tradePayload.tx_buyer_id = options.txBuyerId;
    tradePayload.tx_seller_id = options.txSellerId;
    tradePayload.tx_status = "initiated";
  }

  const conversation = await prisma.$transaction(async (tx) => {
    const created = await tx.conversations.create({
      data: {
        ...tradePayload,
      },
    });

    await tx.conversation_participants.createMany({
      data: participantIds.map((participantId) => ({
        conversation_id: created.id,
        user_id: participantId,
        joined_at: new Date(),
      })),
      skipDuplicates: true,
    });

    return tx.conversations.findUnique({
      where: { id: created.id },
      include: {
        conversation_participants: {
          include: {
            users: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { sent_at: "desc" },
        },
      },
    });
  });

  if (!conversation) {
    throw new AppError("Unable to create conversation", 500, "CREATE_FAILED");
  }

  return mapConversationToDto(conversation);
}

export async function checkParticipant(
  userId: string | null | undefined,
  conversationId: string
) {
  assertAuth(userId);
  const participant = await prisma.conversation_participants.findUnique({
    where: {
      conversation_id_user_id: {
        conversation_id: conversationId,
        user_id: userId!,
      },
    },
  });

  return Boolean(participant);
}

async function createTradeNotifications(
  tx: any,
  recipientIds: string[],
  type: string,
  title: string,
  body: string,
  data: Record<string, any>
) {
  return createNotifications(
    tx,
    recipientIds.map((userId) => ({
      userId,
      type: type as any,
      title,
      body,
      data,
    }))
  );
}

export async function confirmTrade(
  actorId: string | null | undefined,
  conversationId: string
) {
  assertAuth(actorId);
  const userId = actorId!.trim();

  const conversation = await prisma.conversations.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }
  if (!conversation.tx_post_id) {
    throw new AppError("This conversation is not a trade", 400, "NOT_A_TRADE");
  }
  if (conversation.tx_status === "completed" || conversation.tx_status === "cancelled") {
    throw new AppError("Trade cannot be confirmed in its current state", 400, "INVALID_TRADE_STATE");
  }
  if (userId !== conversation.tx_buyer_id && userId !== conversation.tx_seller_id) {
    throw new ForbiddenError("Only buyer or seller can confirm the trade");
  }

  const now = new Date();
  const updateData: Record<string, any> = {
    updated_at: now,
  };

  if (userId === conversation.tx_buyer_id && !conversation.tx_buyer_confirmed_at) {
    updateData.tx_buyer_confirmed_at = now;
  }
  if (userId === conversation.tx_seller_id && !conversation.tx_seller_confirmed_at) {
    updateData.tx_seller_confirmed_at = now;
  }
  if (
    (conversation.tx_buyer_confirmed_at || updateData.tx_buyer_confirmed_at) &&
    (conversation.tx_seller_confirmed_at || updateData.tx_seller_confirmed_at)
  ) {
    updateData.tx_status = "both_confirmed";
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.conversations.update({
      where: { id: conversationId },
      data: updateData,
    });

    const notifications =
      updateData.tx_status === "both_confirmed"
        ? await createTradeNotifications(tx, [
          conversation.tx_buyer_id === userId
            ? conversation.tx_seller_id!
            : conversation.tx_buyer_id!,
        ],
          "tx_both_confirmed",
          "Trade ready for completion",
          "Both buyer and seller have confirmed the trade.",
          { conversationId: conversationId }
        )
        : [];

    return { updated, notifications };
  });

  if (result.notifications.length > 0) {
    await broadcastNotifications(result.notifications);
  }

  return mapConversationToDto(
    await getConversationRecord(userId, conversationId)
  );
}

export async function adminJoinTrade(
  adminId: string | null | undefined,
  conversationId: string
) {
  assertAuth(adminId);
  const userId = adminId!.trim();
  await authService.requireUserHasRole(userId, ["admin"]);

  const conversation = await prisma.conversations.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }
  if (!conversation.tx_post_id) {
    throw new AppError("This conversation is not a trade", 400, "NOT_A_TRADE");
  }
  if (conversation.tx_status === "completed" || conversation.tx_status === "cancelled") {
    throw new AppError("Trade cannot be joined in its current state", 400, "INVALID_TRADE_STATE");
  }

  const now = new Date();
  const notifications = await prisma.$transaction(async (tx) => {
    const updated = await tx.conversations.update({
      where: { id: conversationId },
      data: {
        tx_admin_id: userId,
        tx_admin_joined_at: now,
        updated_at: now,
      },
    });

    const recipientIds = [conversation.tx_buyer_id, conversation.tx_seller_id].filter(
      (value): value is string => Boolean(value)
    );

    const notifications = await createTradeNotifications(
      tx,
      recipientIds,
      "tx_admin_joined",
      "Admin joined the trade",
      "A moderator has joined the conversation to help with the transaction.",
      { conversationId }
    );

    return { updated, notifications };
  });

  await broadcastNotifications(notifications.notifications);
  return mapConversationToDto(
    await getConversationRecordById(conversationId)
  );
}

export async function completeTrade(
  actorId: string | null | undefined,
  conversationId: string
) {
  assertAuth(actorId);
  const userId = actorId!.trim();

  const conversation = await prisma.conversations.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }
  if (!conversation.tx_post_id) {
    throw new AppError("This conversation is not a trade", 400, "NOT_A_TRADE");
  }
  if (conversation.tx_status === "completed" || conversation.tx_status === "cancelled") {
    throw new AppError("Trade cannot be completed in its current state", 400, "INVALID_TRADE_STATE");
  }

  const canAdminComplete =
    userId === conversation.tx_admin_id && !!conversation.tx_admin_joined_at;
  const canPartyComplete =
    (userId === conversation.tx_buyer_id || userId === conversation.tx_seller_id) &&
    conversation.tx_status === "both_confirmed";

  if (!canAdminComplete && !canPartyComplete) {
    throw new ForbiddenError("Trade cannot be completed yet");
  }

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.conversations.update({
      where: { id: conversationId },
      data: {
        tx_status: "completed",
        tx_completed_at: now,
        updated_at: now,
      },
    });

    const recipientIds = [conversation.tx_buyer_id, conversation.tx_seller_id].filter(
      (value): value is string => Boolean(value)
    );

    const notifications = await createTradeNotifications(
      tx,
      recipientIds,
      "tx_completed",
      "Trade completed",
      "The transaction has been marked as completed.",
      { conversationId }
    );

    return { updated, notifications };
  });

  await broadcastNotifications(result.notifications);
  return mapConversationToDto(
    await getConversationRecordById(conversationId)
  );
}

export async function cancelTrade(
  actorId: string | null | undefined,
  conversationId: string
) {
  assertAuth(actorId);
  const userId = actorId!.trim();

  const conversation = await prisma.conversations.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }
  if (!conversation.tx_post_id) {
    throw new AppError("This conversation is not a trade", 400, "NOT_A_TRADE");
  }
  if (conversation.tx_status === "completed" || conversation.tx_status === "cancelled") {
    throw new AppError("Trade cannot be cancelled in its current state", 400, "INVALID_TRADE_STATE");
  }
  if (
    userId !== conversation.tx_buyer_id &&
    userId !== conversation.tx_seller_id &&
    userId !== conversation.tx_admin_id
  ) {
    throw new ForbiddenError("Only buyer, seller or admin can cancel the trade");
  }

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.conversations.update({
      where: { id: conversationId },
      data: {
        tx_status: "cancelled",
        tx_cancelled_at: now,
        updated_at: now,
      },
    });

    const recipientIds = [conversation.tx_buyer_id, conversation.tx_seller_id].filter(
      (value): value is string => Boolean(value)
    );

    const notifications = await createTradeNotifications(
      tx,
      recipientIds,
      "tx_cancelled",
      "Trade cancelled",
      "The transaction has been cancelled.",
      { conversationId }
    );

    return { updated, notifications };
  });

  await broadcastNotifications(result.notifications);
  return mapConversationToDto(
    await getConversationRecordById(conversationId)
  );
}

export async function updateLastReadAt(
  userId: string | null | undefined,
  conversationId: string
) {
  assertAuth(userId);

  const participant = await prisma.conversation_participants.update({
    where: {
      conversation_id_user_id: {
        conversation_id: conversationId,
        user_id: userId!,
      },
    },
    data: {
      last_read_at: new Date(),
    },
  });

  return participant.last_read_at?.toISOString() ?? null;
}

export const conversationService = {
  listConversations,
  getConversation,
  getConversationDetail,
  findConversationBetweenUsers,
  createConversation,
  checkParticipant,
  confirmTrade,
  adminJoinTrade,
  completeTrade,
  cancelTrade,
  updateLastReadAt,
};

export default conversationService;
