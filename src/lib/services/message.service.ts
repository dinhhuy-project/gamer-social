import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppError, ForbiddenError } from "./shared/app-error";
import { assertAuth } from "./shared/assert";
import { ChatRealtimeService } from "@/lib/services/realtime";
import { createNotifications, broadcastNotifications } from "@/lib/services";
import type { MessageDto, SendMessageInput } from "@/types/message.types";

function sanitizeContent(content?: string) {
  const trimmed = (content ?? "").trim();
  return trimmed.length ? trimmed.slice(0, 2000) : null;
}

function normalizeMediaUrls(mediaUrls?: string[]) {
  if (!Array.isArray(mediaUrls)) return [];
  return mediaUrls.filter((url) => typeof url === "string" && url.trim().length > 0);
}

function mapMessageToDto(message: any): MessageDto {
  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    content: message.content ?? null,
    mediaUrls: message.media_urls ?? [],
    sentAt: message.sent_at.toISOString(),
  };
}

export async function createMessage(actorId: string | null | undefined, input: SendMessageInput) {
  assertAuth(actorId);

  const conversationId = input.conversationId?.trim();
  const senderId = input.senderId?.trim();

  if (!conversationId) {
    throw new AppError("conversationId is required", 400, "INVALID_INPUT");
  }
  if (!senderId) {
    throw new AppError("senderId is required", 400, "INVALID_INPUT");
  }
  if (senderId !== actorId) {
    throw new ForbiddenError("Sender mismatch");
  }

  const content = sanitizeContent(input.content);
  const mediaUrls = normalizeMediaUrls(input.mediaUrls);

  if (!content && mediaUrls.length === 0) {
    throw new AppError("Message content or media is required", 400, "INVALID_INPUT");
  }

  const conversation = await prisma.conversations.findUnique({
    where: { id: conversationId },
    include: {
      conversation_participants: {
        select: { user_id: true },
      },
    },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404, "NOT_FOUND");
  }

  const participants = conversation.conversation_participants.map((part) => part.user_id);
  if (!participants.includes(actorId)) {
    throw new ForbiddenError("User is not part of this conversation");
  }

  const recipientIds = participants.filter((id) => id !== actorId);

  const result = await prisma.$transaction(async (tx) => {
    const message = await tx.messages.create({
      data: {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        media_urls: mediaUrls,
      },
    });

    await tx.conversations.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    });

    const entries = recipientIds.map((recipientId) => ({
      userId: recipientId,
      type: "new_message" as const,
      title: "New message",
      body: content ? content.slice(0, 120) : "You have received a new message.",
      data: { conversationId, messageId: message.id, senderId },
    }));

    const createdNotifications = await createNotifications(tx, entries, { actorId: senderId });

    return { message, notifications: createdNotifications };
  });

  const createdMessage = result.message;
  const createdNotifications = result.notifications;
  const dto = mapMessageToDto(createdMessage);

  try {
    await ChatRealtimeService.broadcastMessage(supabaseAdmin, conversationId, {
      message: dto,
    });
  } catch {
    // ignore realtime broadcast failure; core DB work already succeeded
  }

  try {
    await broadcastNotifications(createdNotifications);
  } catch {
    // ignore realtime notification failure
  }

  return dto;
}

export async function listMessages(
  viewerId: string | null | undefined,
  conversationId: string,
  page = 1,
  perPage = 50
) {
  assertAuth(viewerId);
  const actorId = viewerId as string;

  const take = Math.max(1, Math.min(200, perPage));
  const skip = Math.max(0, (page - 1) * take);

  const conversation = await prisma.conversations.findUnique({
    where: { id: conversationId },
    include: {
      conversation_participants: {
        select: { user_id: true },
      },
    },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404, "NOT_FOUND");
  }

  const participants = conversation.conversation_participants.map((part) => part.user_id);
  if (!participants.includes(actorId)) {
    throw new ForbiddenError("User is not part of this conversation");
  }

  const [total, messages] = await prisma.$transaction([
    prisma.messages.count({
      where: {
        conversation_id: conversationId,
        is_deleted: false,
      },
    }),
    prisma.messages.findMany({
      where: {
        conversation_id: conversationId,
        is_deleted: false,
      },
      orderBy: { sent_at: "asc" },
      skip,
      take,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));

  return {
    data: messages.map(mapMessageToDto),
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

export const messageService = {
  createMessage,
  listMessages,
};

export default messageService;
