import { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

export class ChannelService {
  static createChatChannel(
    supabase: SupabaseClient,
    conversationId: string
  ): RealtimeChannel {
    return supabase.channel(
      `chat:${conversationId}`,
      {
        config: {
          private: true,
        },
      }
    );
  }

  static createNotificationChannel(
    supabase: SupabaseClient,
    userId: string
  ): RealtimeChannel {
    return supabase.channel(
      `notif:${userId}`,
      {
        config: {
          private: true,
        },
      }
    );
  }

  static createPresenceChannel(
    supabase: SupabaseClient,
    conversationId: string
  ): RealtimeChannel {
    return supabase.channel(
      `presence:${conversationId}`,
      {
        config: {
          private: true,
          presence: {
            key: crypto.randomUUID(),
          },
        },
      }
    );
  }
}