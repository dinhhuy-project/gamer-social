"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "@/hooks/users/useUser";

type FollowStatusDTO = {
  actorId: string;
  targetId: string;
  following: boolean;
  followerCount: number;
  followingCount: number;
};

async function postFollow(username: string) {
  const res = await fetch(`/api/users/${encodeURIComponent(username)}/follow`, {
    method: "POST",
    credentials: "same-origin",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to follow user");
  }

  return (await res.json()) as FollowStatusDTO;
}

async function deleteFollow(username: string) {
  const res = await fetch(`/api/users/${encodeURIComponent(username)}/follow`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to unfollow user");
  }

  return (await res.json()) as FollowStatusDTO;
}

export function useFollow(username?: string) {
  const qc = useQueryClient();

  const followMutation = useMutation<FollowStatusDTO, Error, void, { prevUser: UserProfile | null }>({
    mutationFn: () => postFollow(username!),
    onMutate: async () => {
      if (!username) return { prevUser: null };

      await qc.cancelQueries({ queryKey: ["users", username] });

      const prevUser = qc.getQueryData<UserProfile>(["users", username]) ?? null;

      if (prevUser) {
        qc.setQueryData<UserProfile>(["users", username], {
          ...prevUser,
          isFollowing: true,
          followersCount: prevUser.followersCount + 1,
        });
      }

      return { prevUser };
    },
    onError: (err: Error, _vars: void, context?: { prevUser: UserProfile | null }) => {
      if (username && context?.prevUser) {
        qc.setQueryData(["users", username], context.prevUser);
      }
    },
    onSettled: () => {
      if (!username) return;
      qc.invalidateQueries({ queryKey: ["users", username] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const unfollowMutation = useMutation<FollowStatusDTO, Error, void, { prevUser: UserProfile | null }>({
    mutationFn: () => deleteFollow(username!),
    onMutate: async () => {
      if (!username) return { prevUser: null };

      await qc.cancelQueries({ queryKey: ["users", username] });

      const prevUser = qc.getQueryData<UserProfile>(["users", username]) ?? null;

      if (prevUser) {
        qc.setQueryData<UserProfile>(["users", username], {
          ...prevUser,
          isFollowing: false,
          followersCount: Math.max(0, prevUser.followersCount - 1),
        });
      }

      return { prevUser };
    },
    onError: (err: Error, _vars: void, context?: { prevUser: UserProfile | null }) => {
      if (username && context?.prevUser) {
        qc.setQueryData(["users", username], context.prevUser);
      }
    },
    onSettled: () => {
      if (!username) return;
      qc.invalidateQueries({ queryKey: ["users", username] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  return {
    followMutation,
    unfollowMutation,
    follow: () => followMutation.mutate(),
    unfollow: () => unfollowMutation.mutate(),
  };
}
