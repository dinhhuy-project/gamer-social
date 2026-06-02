"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";

async function fetchTotalUnread() {
  // Feature disabled: always return 0 without network requests
  return 0;
}

export function useUnreadTotalCount() {
  return useQuery<number, Error>({
    queryKey: QUERY_KEYS.unread.total(),
    queryFn: fetchTotalUnread,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}
