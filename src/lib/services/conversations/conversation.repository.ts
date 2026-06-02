import { prisma } from "@/lib/prisma";

export async function getConversationRecord(userId: string, conversationId: string) {
  return prisma.conversations.findFirst({
    where: {
      id: conversationId,
      conversation_participants: { some: { user_id: userId } },
    },
    include: {
      conversation_participants: { include: { users: true } },
      messages: { take: 1, orderBy: { sent_at: "desc" } },
    },
  });
}

export async function getConversationRecordById(conversationId: string) {
  return prisma.conversations.findUnique({
    where: { id: conversationId },
    include: {
      conversation_participants: { include: { users: true } },
      messages: { take: 1, orderBy: { sent_at: "desc" } },
    },
  });
}

export async function listConversationsForUser(userId: string, skip: number, take: number) {
  const [total, conversations] = await prisma.$transaction([
    prisma.conversation_participants.count({ where: { user_id: userId } }),
    prisma.conversations.findMany({
      where: { conversation_participants: { some: { user_id: userId } } },
      include: {
        conversation_participants: { include: { users: true } },
        messages: { take: 1, orderBy: { sent_at: "desc" } },
      },
      orderBy: { updated_at: "desc" },
      skip,
      take,
    }),
  ]);

  return { total, conversations };
}

export async function findConversationBetweenUsersRecord(userId: string, otherUserId: string) {
  return prisma.conversations.findFirst({
    where: {
      AND: [
        { conversation_participants: { some: { user_id: userId } } },
        { conversation_participants: { some: { user_id: otherUserId } } },
        { conversation_participants: { every: { user_id: { in: [userId, otherUserId] } } } },
      ],
    },
    include: {
      conversation_participants: { include: { users: true } },
      messages: { take: 1, orderBy: { sent_at: "desc" } },
    },
  });
}

export async function createConversationTx(tx: any, data: { participantIds: string[]; tradePayload?: Record<string, any> }) {
  const created = await tx.conversations.create({ data: { ...(data.tradePayload ?? {}) } });

  await tx.conversation_participants.createMany({
    data: data.participantIds.map((participantId) => ({ conversation_id: created.id, user_id: participantId, joined_at: new Date() })),
    skipDuplicates: true,
  });

  return tx.conversations.findUnique({ where: { id: created.id }, include: { conversation_participants: { include: { users: true } }, messages: { take: 1, orderBy: { sent_at: "desc" } } } });
}

export async function checkParticipant(userId: string, conversationId: string) {
  const participant = await prisma.conversation_participants.findUnique({ where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } } });
  return Boolean(participant);
}

export async function updateParticipantLastReadAt(userId: string, conversationId: string) {
  const participant = await prisma.conversation_participants.update({
    where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    data: { last_read_at: new Date() },
  });

  return participant.last_read_at?.toISOString() ?? null;
}

export async function updateConversationTx(tx: any, conversationId: string, data: Record<string, any>) {
  return tx.conversations.update({ where: { id: conversationId }, data });
}
