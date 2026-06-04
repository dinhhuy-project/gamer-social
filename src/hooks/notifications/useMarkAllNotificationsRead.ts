"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/api-client";

async function postMarkAllRead() {
  return apiClient(`/api/notifications/read-all`, { method: "POST", credentials: "same-origin" });
}

export function useMarkAllNotificationsRead(userId?: string) {
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: postMarkAllRead,
    onMutate: async () => {
      if (!userId) return {};
      await qc.cancelQueries({ queryKey: QUERY_KEYS.notifications.unread(userId) });

      const prevUnread = qc.getQueryData<number>(QUERY_KEYS.notifications.unread(userId));
      const prevNotifQueries = qc.getQueriesData({ queryKey: QUERY_KEYS.notifications.root(userId), exact: false });

      // optimistic: set unread to 0 and mark all cached notifications as read
      qc.setQueryData(QUERY_KEYS.notifications.unread(userId), 0);
      for (const [key] of prevNotifQueries) {
        qc.setQueryData(key, (prev: any) => {
          if (!prev) return prev;
          if (Array.isArray(prev.data)) {
            return { ...prev, data: prev.data.map((it: any) => ({ ...it, isRead: true })) };
          }
          return prev;
        });
      }

      return { prevUnread, prevNotifQueries };
    },
    onError: (_err, _vars, ctx: any) => {
      if (!userId) return;
      if (ctx?.prevUnread !== undefined) qc.setQueryData(QUERY_KEYS.notifications.unread(userId), ctx.prevUnread);
      if (ctx?.prevNotifQueries) {
        for (const [key, data] of ctx.prevNotifQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSuccess: () => {
      // server confirmed - no further action required
    },
  });

  return {
    markAllRead: m.mutateAsync,
    isMarkingAll: m.status === "pending",
    error: m.error,
  };
}

export default useMarkAllNotificationsRead;
