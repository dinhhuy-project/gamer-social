export interface SendMessageInput {
  conversationId: string;
  senderId: string;

  content?: string;

  mediaUrls?: string[];
}

export interface MessageDto {
  id: string;

  conversationId: string;

  senderId: string;

  content: string | null;

  mediaUrls: string[];

  sentAt: string;
}