"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";

async function fetchTotalUnread() {
  const res = await fetch(`/api/messages/unread-count`, { credentials: "same-origin" });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? "Failed to get total unread count");
  }

  const data = await res.json();
  return data?.total ?? 0;
}

export function useUnreadTotalCount() {
  return useQuery<number, Error>({
    queryKey: QUERY_KEYS.unread.total(),
    queryFn: fetchTotalUnread,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}
