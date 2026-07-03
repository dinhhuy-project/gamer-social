"use client";

import { createContext, useContext, useEffect } from "react";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useNotificationsRealtime } from "@/lib/realtime/hooks/useNotificationsRealtime";

const NotificationContext = createContext<void>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: currentUser } = useCurrentUser();

  // Setup realtime notifications subscription at the provider level
  // This ensures the subscription persists across page navigations
  useNotificationsRealtime(currentUser?.id);

  return (
    <NotificationContext.Provider value={undefined}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationProvider() {
  return useContext(NotificationContext);
}
