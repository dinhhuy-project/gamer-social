import type { NotificationCreateInput } from "@/types/notification.types";

export function buildNewFollowerNotification(actorId: string, targetUserId: string): NotificationCreateInput[] {
  return [
    {
      userId: targetUserId,
      type: "new_follower",
      title: null,
      body: null,
      data: { followerId: actorId, actorId },
    },
  ];
}

export function buildNewMessageNotification(actorId: string, recipientId: string, conversationId: string, messageId?: string, snippet?: string): NotificationCreateInput[] {
  return [
    {
      userId: recipientId,
      type: "new_message",
      title: null,
      body: snippet ?? null,
      data: { actorId, conversationId, messageId },
    },
  ];
}

export function buildPostReactionNotification(actorId: string, postOwnerId: string, postId: string): NotificationCreateInput[] {
  return [
    {
      userId: postOwnerId,
      type: "post_reaction",
      title: null,
      body: null,
      data: { actorId, postId },
    },
  ];
}

export function buildPostCommentNotification(actorId: string, postOwnerId: string, postId: string, commentId?: string): NotificationCreateInput[] {
  return [
    {
      userId: postOwnerId,
      type: "post_comment",
      title: null,
      body: null,
      data: { actorId, postId, commentId },
    },
  ];
}

export default {
  buildNewFollowerNotification,
  buildNewMessageNotification,
  buildPostReactionNotification,
  buildPostCommentNotification,
};
