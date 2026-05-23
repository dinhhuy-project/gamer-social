"use client";

import { useMemo, useState } from "react";
import { usePosts } from "@/hooks/posts/usePosts";
import CreatePostModal from "@/components/post/CreatePostModal";
import { PostCard } from "@/components/post/PostCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

export default function FeedPage() {
  const [page, setPage] = useState(1);
  const postsQuery = usePosts(page, 10);
  const posts = postsQuery.data?.data ?? [];

  const totalPages = postsQuery.data?.totalPages ?? 1;

  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const visiblePosts = posts.filter((p) => !removedIds.has(p.id));

  const pageItems = useMemo(() => {
    const tp = totalPages;
    const current = page;
    if (tp <= 7) return Array.from({ length: tp }).map((_, i) => i + 1 as number);

    const items: Array<number | "ellipsis"> = [];
    items.push(1);
    const left = Math.max(2, current - 1);
    const right = Math.min(tp - 1, current + 1);
    if (left > 2) items.push("ellipsis");
    for (let i = left; i <= right; i++) items.push(i);
    if (right < tp - 1) items.push("ellipsis");
    items.push(tp);
    return items;
  }, [totalPages, page]);

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

        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationPrevious
              onClick={() => {
                if (page > 1) setPage((s) => s - 1);
              }}
              text="Trước"
            />

            <PaginationContent>
              {pageItems.map((it, idx) =>
                it === "ellipsis" ? (
                  <PaginationItem key={`e-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={it}>
                    <PaginationLink isActive={it === page} onClick={() => setPage(it)}>
                      {it}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
            </PaginationContent>

            <PaginationNext
              onClick={() => {
                if (page < totalPages) setPage((s) => s + 1);
              }}
              text="Sau"
            />
          </Pagination>
        )}
      </div>
    </div>
  );
}