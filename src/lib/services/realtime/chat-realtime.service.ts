import { SupabaseClient } from "@supabase/supabase-js";
import { ChannelService } from "./channel.service";

export interface RealtimeMessagePayload {
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string | null;
    mediaUrls: string[];
    sentAt: string;
  };
}

export class ChatRealtimeService {
  static subscribeToMessages(
    supabase: SupabaseClient,
    conversationId: string,
    callback: (
      payload: RealtimeMessagePayload
    ) => void
  ) {
    const channel =
      ChannelService.createChatChannel(
        supabase,
        conversationId
      );

    channel.on(
      "broadcast",
      {
        event: "message:new",
      },
      ({ payload }) => {
        callback(payload as RealtimeMessagePayload);
      }
    );

    return channel;
  }

  static async broadcastMessage(
    supabase: SupabaseClient,
    conversationId: string,
    payload: RealtimeMessagePayload
  ) {
    const channel =
      ChannelService.createChatChannel(
        supabase,
        conversationId
      );

    await channel.subscribe();

    return channel.send({
      type: "broadcast",
      event: "message:new",
      payload,
    });
  }
}