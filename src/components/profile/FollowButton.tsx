"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useUser } from "@/hooks/users/useUser";
import { useFollow } from "@/hooks/users/useFollow";

export default function FollowButton({
  username,
}: {
  username: string;
}) {
  const { data: profile, isLoading: profileLoading } =
    useUser(username);

  const { data: me } = useCurrentUser();

  const {
    follow,
    unfollow,
    followMutation,
    unfollowMutation,
  } = useFollow(username);

  const loading =
    followMutation.isPending ||
    unfollowMutation.isPending;

  // Hide button on own profile
  if (
    me?.id &&
    profile?.id &&
    me.id === profile.id
  ) {
    return null;
  }

  const isFollowing =
    profile?.isFollowing ?? false;

  const handleClick = () => {
    if (loading) return;

    if (isFollowing) {
      unfollow();
    } else {
      follow();
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={loading || profileLoading}
      className={`
        h-10
        min-w-[120px]
        rounded-xl
        border
        px-5
        text-sm
        font-semibold
        transition-all
        duration-200

        ${isFollowing
          ? `
              border-orange-500
              bg-orange-500
              text-white
              shadow-[0_0_20px_rgba(249,115,22,0.35)]
              hover:bg-orange-400
              hover:border-orange-400
            `
          : `
              border-orange-500/20
              bg-black
              text-white
              hover:border-orange-500
              hover:bg-orange-500/10
              hover:text-orange-400
            `
        }

        disabled:pointer-events-none
        disabled:opacity-60
      `}
    >
      {loading && (
        <Spinner className="mr-2 size-4" />
      )}

      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}