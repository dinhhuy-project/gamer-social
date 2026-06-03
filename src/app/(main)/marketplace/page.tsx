"use client";

import React, { useMemo, useState } from "react";
import { usePosts } from "@/hooks/posts/usePosts";
import { PostCard } from "@/components/post/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

export default function MarketplacePage() {
  const [page, setPage] = useState(1);
  const postsQuery = usePosts(page, 6, true);
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
    <div className="max-w-7xl mx-auto py-6 px-4">
      <header className="mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Marketplace</h1>
          <p className="text-sm text-zinc-400">Mua bán và trao đổi vật phẩm game</p>
        </div>
      </header>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {postsQuery.isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-2">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ))}

        {!postsQuery.isLoading && visiblePosts.length === 0 && (
          <div className="col-span-full p-6 text-center text-sm text-zinc-400">Không có mục nào trong marketplace.</div>
        )}

        {!postsQuery.isLoading && visiblePosts.map((p) => (
          <PostCard key={p.id} post={p as any} onDeleted={handleDeleted} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
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
        </div>
      )}
    </div>
  );
}

