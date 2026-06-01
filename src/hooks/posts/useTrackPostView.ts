// hooks/posts/useTrackPostView.ts

"use client";

import { useEffect } from "react";
import { useIncrementPostView } from "./useIncrementView";

export function useTrackPostView(postId?: string) {
  const { mutate } = useIncrementPostView();

  useEffect(() => {
    if (!postId) return;

    const key = `viewed-post-${postId}`;

    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");
    mutate(postId);
  }, [postId, mutate]);
}