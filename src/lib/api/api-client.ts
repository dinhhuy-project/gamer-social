import { getRouteAbortSignal } from "@/lib/route/route-abort-manager";

export async function apiClient<T>(
  url: string,
  options?: RequestInit,
  signal?: AbortSignal
): Promise<T> {
  const routeSignal = typeof window !== "undefined" ? getRouteAbortSignal() : undefined;

  // If both a call-local signal and the route-scoped signal exist, combine them
  const signals: AbortSignal[] = [];
  if (signal) signals.push(signal);
  if (routeSignal) signals.push(routeSignal);

  let finalSignal: AbortSignal | undefined = undefined;
  let combinedController: AbortController | undefined;
  let onAbort: (() => void) | undefined;

  if (signals.length === 1) {
    finalSignal = signals[0];
  } else if (signals.length === 2) {
    combinedController = new AbortController();
    onAbort = () => combinedController!.abort();
    signals[0].addEventListener("abort", onAbort);
    signals[1].addEventListener("abort", onAbort);
    finalSignal = combinedController.signal;
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: finalSignal,
    });

    if (!res.ok) {
      // Try to parse JSON error body, fall back to text/status
      let body: any = null;
      try {
        body = await res.json();
      } catch {
        // ignore
      }

      const text = typeof body === "string" ? body : body?.error ?? (await res.text().catch(() => null));
      const message = text || res.statusText || `Request failed with status ${res.status}`;
      const err = new Error(message);
      (err as any).status = res.status;
      throw err;
    }

    // Parse JSON result
    return (await res.json()) as T;
  } finally {
    if (combinedController && onAbort) {
      try {
        signals[0].removeEventListener("abort", onAbort);
        signals[1].removeEventListener("abort", onAbort);
      } catch {
        // ignore
      }
    }
  }
}

export default apiClient;
