"use client";

import { useQuery } from "@tanstack/react-query";
import type { PublicUser } from "@/types/api.types";
import { apiClient } from "@/lib/api/api-client";

export type UserProfile = PublicUser & {
  bio: string | null;
  coverUrl: string | null;
  isFollowing?: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  sharedPostsCount: number;
};

async function fetchUser(username: string, signal?: AbortSignal) {
  return apiClient<UserProfile>(`/api/users/${encodeURIComponent(username)}`, { credentials: "same-origin" }, signal);
}

export function useUser(username?: string) {
  return useQuery<UserProfile, Error>({
    queryKey: ["users", username ?? ""],
    queryFn: ({ signal }) => fetchUser(username!, signal),
    enabled: !!username,
  });
}
