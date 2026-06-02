"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";

async function postMarkNotificationRead(notificationId: string) {
  const res = await fetch(`/api/notifications/${notificationId}/read`, { method: "POST", credentials: "same-origin" });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to mark notification read");
  return res.json();
}

export function useMarkNotificationRead(userId?: string) {
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: postMarkNotificationRead,
    onMutate: async (notificationId: string) => {
      if (!userId) return {};
      await qc.cancelQueries({ queryKey: QUERY_KEYS.notifications.unread(userId) });

      const prevUnread = qc.getQueryData<number>(QUERY_KEYS.notifications.unread(userId));
      const prevNotifQueries = qc.getQueriesData({ queryKey: QUERY_KEYS.notifications.root(userId), exact: false });

      // optimistic update: decrement unread and mark item read in cached lists
      qc.setQueryData(QUERY_KEYS.notifications.unread(userId), (old: number | undefined) => Math.max(0, (old ?? 0) - 1));

      for (const [key] of prevNotifQueries) {
        qc.setQueryData(key, (prev: any) => {
          if (!prev) return prev;
          if (Array.isArray(prev.data)) {
            return { ...prev, data: prev.data.map((it: any) => (it.id === notificationId ? { ...it, isRead: true } : it)) };
          }
          return prev;
        });
      }

      return { prevUnread, prevNotifQueries };
    },
    onError: (_err, notificationId, ctx: any) => {
      if (!userId) return;
      if (ctx?.prevUnread !== undefined) qc.setQueryData(QUERY_KEYS.notifications.unread(userId), ctx.prevUnread);
      if (ctx?.prevNotifQueries) {
        for (const [key, data] of ctx.prevNotifQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSuccess: () => {
      // server confirmed - nothing else to do because we already updated cache optimistically
    },
  });

  return {
    markNotificationRead: m.mutateAsync,
    isMarking: m.status === "pending",
    error: m.error,
  };
}

export default useMarkNotificationRead;
