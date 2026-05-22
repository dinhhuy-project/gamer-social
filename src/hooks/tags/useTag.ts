"use client";

import { useQuery } from "@tanstack/react-query";
import type { TagDTO } from "@/types/api.types";

async function fetchTag(slug: string) {
  const res = await fetch(`/api/tags/${encodeURIComponent(slug)}`, { credentials: "same-origin" });
  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch tag");
  }

  return (await res.json()) as TagDTO;
}

export function useTag(slug?: string | null) {
  return useQuery<TagDTO, Error>({
    queryKey: ["tags", slug ?? ""],
    enabled: !!slug,
    queryFn: () => fetchTag(String(slug)),
  });
}

export default useTag;
