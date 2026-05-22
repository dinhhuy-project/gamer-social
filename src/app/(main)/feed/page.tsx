"use client";

import { useState } from "react";
import { usePosts } from "@/hooks/posts/usePosts";
import CreatePostModal from "@/components/post/CreatePostModal";
import { PostCard } from "@/components/post/PostCard";

export default function FeedPage() {
  const [page, setPage] = useState(1);
  const postsQuery = usePosts(page, 10);
  const posts = postsQuery.data?.data ?? [];


  const hasMore = postsQuery.data?.hasMore ?? false;

  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const visiblePosts = posts.filter((p) => !removedIds.has(p.id));
  console.log(visiblePosts);

  function handleDeleted(id: string) {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }



  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <CreatePostModal availableTags={[]} onCreated={() => setPage(1)} />

      <div className="space-y-4">
        {postsQuery.isLoading && (
          <div className="p-6 text-center text-sm text-[#8b8fa8]">Đang tải bài viết...</div>
        )}

        {postsQuery.isError && (
          <div className="p-6 text-center text-sm text-red-400">Có lỗi: {postsQuery.error?.message}</div>
        )}

        {!postsQuery.isLoading && visiblePosts.length === 0 && (
          <div className="p-6 text-center text-sm text-[#8b8fa8]">Chưa có bài viết nào. Hãy là người chia sẻ đầu tiên!</div>
        )}

        {visiblePosts.map((p) => (
          <PostCard
            key={p.id}
            post={p as any}
            hasReacted={false}
            isSaved={false}
            onDeleted={handleDeleted}
          />
        ))}

        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={() => setPage((s) => s + 1)}
              className="px-4 py-2 rounded-lg bg-[#2b2f3a] text-white hover:bg-[#363b47]"
            >
              Tải thêm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}