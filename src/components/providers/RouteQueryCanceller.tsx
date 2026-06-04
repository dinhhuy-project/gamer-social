"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { realtimeManager } from "@/lib/realtime/realtime-manager";
import { cancelRouteRequests } from "@/lib/route/route-abort-manager";

export function RouteQueryCanceller() {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Abort any route-scoped requests (non-React-Query apiClient calls)
    try {
      cancelRouteRequests();
    } catch (err) {
      // ignore
    }

    // Cancel outstanding queries (this aborts fetches via the provided signal)
    queryClient.cancelQueries();

    // Also cleanup any registered realtime channels
    try {
      realtimeManager.cleanup();
    } catch (err) {
      // ignore
    }
    // We intentionally do not return anything here; the cancellation/cleanup
    // is triggered synchronously when pathname changes.
  }, [pathname, queryClient]);

  return null;
}

export default RouteQueryCanceller;
