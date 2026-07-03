import type { SupabaseClient } from "@supabase/supabase-js";
import { mapNotificationRecordToDto } from "@/lib/services/notifications/notification.mapper";
import { notificationsInsertOpts, NOTIFICATIONS_CHANNEL } from "@/lib/realtime/channels/notification-channel";
import { realtimeManager } from "@/lib/realtime/realtime-manager";

export function subscribeToNotifications(
  supabase: SupabaseClient,
  userId: string,
  onInsert: (notif: any) => void
) {
  const seen = new Set<string>();
  const channelName = `${NOTIFICATIONS_CHANNEL}-${userId}-${Math.random().toString(36).slice(2, 10)}`;
  const opts = notificationsInsertOpts(userId as any);

  const channel = (supabase as any)
    .channel(channelName)
    .on("postgres_changes", opts, (payload: any) => {
      // console.log("[realtime] subscribeToNotifications payload:", payload, { userId });
      try {
        const newRow = payload?.new;
        if (!newRow) return;
        const dto = mapNotificationRecordToDto(newRow);
        if (!dto || !dto.id) return;
        if (seen.has(dto.id)) return;
        seen.add(dto.id);
        onInsert(dto);
      } catch (err) {
        console.error("subscribeToNotifications: handler error", err);
      }
    })
    .subscribe((status: string) => {
      // console.log("[realtime] subscribeToNotifications status:", status, { channel: channelName, opts, userId });
    });

  try {
    realtimeManager.register(supabase, channel, true);
  } catch (err) {
    // ignore
  }

  return () => {
    try {
      supabase.removeChannel(channel);
      try {
        realtimeManager.unregister(supabase, channel);
      } catch {
        // ignore
      }
    } catch (err) { }
  };
}
