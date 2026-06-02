"use client";

import { useMessagesRealtime as useMessagesRealtimeLib } from "@/lib/realtime/hooks/useMessagesRealtime";

export function useMessagesRealtime(): void {
  return useMessagesRealtimeLib();
}

export default useMessagesRealtime;
