"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { UserProfile } from "@/hooks/users/useUser";

type FollowStatusDTO = {
  actorId: string;
  targetId: string;
  following: boolean;
  followerCount: number;
  followingCount: number;
};

async function postFollow(username: string) {
  return apiClient<FollowStatusDTO>(`/api/users/${encodeURIComponent(username)}/follow`, {
    method: "POST",
    credentials: "same-origin",
  });
}

async function deleteFollow(username: string) {
  return apiClient<FollowStatusDTO>(`/api/users/${encodeURIComponent(username)}/follow`, {
    method: "DELETE",
    credentials: "same-origin",
  });
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
