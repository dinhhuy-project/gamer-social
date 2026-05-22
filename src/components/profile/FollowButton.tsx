"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useUser } from "@/hooks/users/useUser";
import { useFollow } from "@/hooks/users/useFollow";

export default function FollowButton({ username }: { username: string }) {
  const { data: profile, isLoading: profileLoading } = useUser(username);
  const { data: me } = useCurrentUser();
  const { follow, unfollow, followMutation, unfollowMutation } =
    useFollow(username);

  const loading =
    followMutation.isPending || unfollowMutation.isPending;

  // don't render follow button on own profile
  if (me?.id && profile?.id && me.id === profile.id) return null;

  const isFollowing = profile?.isFollowing ?? false;

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
      variant={isFollowing ? "outline" : "default"}
      onClick={handleClick}
      disabled={loading || profileLoading}
    >
      {loading ? <Spinner className="mr-2" /> : null}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}