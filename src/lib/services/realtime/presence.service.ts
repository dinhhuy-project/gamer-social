import { SupabaseClient } from "@supabase/supabase-js";
import { ChannelService } from "./channel.service";

export interface PresenceUser {
  userId: string;
  username: string;
  typing?: boolean;
}

export class PresenceService {
  static async track(
    supabase: SupabaseClient,
    conversationId: string,
    user: PresenceUser
  ) {
    const channel =
      ChannelService.createPresenceChannel(
        supabase,
        conversationId
      );

    await channel.subscribe();

    await channel.track(user);

    return channel;
  }

  static subscribe(
    supabase: SupabaseClient,
    conversationId: string,
    onSync: (state: any) => void
  ) {
    const channel =
      ChannelService.createPresenceChannel(
        supabase,
        conversationId
      );

    channel
      .on(
        "presence",
        {
          event: "sync",
        },
        () => {
          onSync(
            channel.presenceState()
          );
        }
      )
      .subscribe();

    return channel;
  }
}