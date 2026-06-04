let controller: AbortController | null = typeof window !== "undefined" ? new AbortController() : null;

export function getRouteAbortSignal(): AbortSignal | undefined {
  return controller?.signal;
}

export function cancelRouteRequests() {
  try {
    // Abort any in-flight route-scoped requests and reset controller
    controller?.abort();
  } catch {
    // ignore
  } finally {
    controller = typeof window !== "undefined" ? new AbortController() : null;
  }
}

export default {
  getRouteAbortSignal,
  cancelRouteRequests,
};
