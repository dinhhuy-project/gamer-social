"use client";

import { use } from "react";
import { usePost } from "@/hooks/posts/usePost";
import PostDetail from "@/components/post/PostDetail";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  params: Promise<{ id: string }>;
};

export default function PostPage({ params }: Props) {
  const { id } = use(params);
  const postQuery = usePost(id);

  if (postQuery.isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4">
        <div className="space-y-4">
          <div className="p-4 border rounded-md">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-48 w-full mt-3 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (postQuery.isError) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4">
        <div className="rounded-lg border border-red-500/40 bg-card p-6 text-sm text-red-300">
          Có lỗi khi tải bài viết: {postQuery.error?.message}
        </div>
      </div>
    );
  }

  const post = postQuery.data as any;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <PostDetail post={post} />
    </div>
  );
}
