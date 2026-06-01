import { SupabaseClient } from "@supabase/supabase-js";
import { ChannelService } from "./channel.service";

export interface NotificationPayload {
  notificationId: string;
  type: string;
  title: string;
  body?: string;
}

export class NotificationRealtimeService {
  static subscribe(
    supabase: SupabaseClient,
    userId: string,
    callback: (
      payload: NotificationPayload
    ) => void
  ) {
    const channel =
      ChannelService.createNotificationChannel(
        supabase,
        userId
      );

    channel.on(
      "broadcast",
      {
        event: "notification:new",
      },
      ({ payload }) => {
        callback(payload as NotificationPayload);
      }
    );

    return channel;
  }

  static async send(
    supabase: SupabaseClient,
    userId: string,
    payload: NotificationPayload
  ) {
    const channel =
      ChannelService.createNotificationChannel(
        supabase,
        userId
      );

    await channel.subscribe();

    return channel.send({
      type: "broadcast",
      event: "notification:new",
      payload,
    });
  }
}