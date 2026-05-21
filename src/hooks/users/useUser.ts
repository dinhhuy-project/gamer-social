"use client";

import { useQuery } from "@tanstack/react-query";
import type { PublicUser } from "@/types/api.types";

export type UserProfile = PublicUser & {
  bio: string | null;
  coverUrl: string | null;
  isFollowing?: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
};

async function fetchUser(username: string) {
  const res = await fetch(`/api/users/${encodeURIComponent(username)}`, { credentials: "same-origin" });
  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) throw new Error("Failed to fetch user");
  const data = await res.json();
  return data as UserProfile;
}

export function useUser(username?: string) {
  return useQuery<UserProfile, Error>({
    queryKey: ["users", username ?? ""],
    queryFn: () => fetchUser(username!),
    enabled: !!username,
  });
}
