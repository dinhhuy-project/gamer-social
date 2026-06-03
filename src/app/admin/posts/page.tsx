"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, FileTextIcon, HomeIcon } from "lucide-react";
import { toast } from "sonner";

import { AdminPostDetailModal } from "@/components/admin/posts/AdminPostDetailModal";
import { AdminPostFilters, type AdminPostFilterState } from "@/components/admin/posts/AdminPostFilters";
import { AdminPostTable } from "@/components/admin/posts/AdminPostTable";
import { ADMIN_POSTS_TEXT } from "@/components/admin/posts/admin-posts.constants";
import { Button } from "@/components/ui/button";
import { useAdminPost, useUpdateAdminPostStatus } from "@/hooks/admin/useAdminPost";
import { useAdminPosts } from "@/hooks/admin/useAdminPosts";

const PAGE_SIZE = 20;

const initialFilters: AdminPostFilterState = {
  search: "",
  postType: "all",
  status: "all",
  listingStatus: "all",
};

export default function AdminPostsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch,
      postType: filters.postType,
      status: filters.status,
      listingStatus: filters.listingStatus,
      page,
      limit: PAGE_SIZE,
    }),
    [debouncedSearch, filters.listingStatus, filters.postType, filters.status, page]
  );

  const postsQuery = useAdminPosts(queryFilters);
  const postDetailQuery = useAdminPost(selectedPostId);
  const updateStatus = useUpdateAdminPostStatus();
  const pagination = postsQuery.data?.pagination;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_30%),linear-gradient(180deg,#09090b,#18181b)] px-4 py-6 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100">
              <FileTextIcon className="size-4" />
              {ADMIN_POSTS_TEXT.postsTitle}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-normal text-white md:text-3xl">
              {ADMIN_POSTS_TEXT.postsTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">{ADMIN_POSTS_TEXT.postsDescription}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="border-cyan-400/20 bg-black/30 text-cyan-100 hover:bg-cyan-400/10">
              <Link href="/feed">
                <HomeIcon />
                {ADMIN_POSTS_TEXT.backToHomePage}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/listings">{ADMIN_POSTS_TEXT.listingsTitle}</Link>
            </Button>
          </div>
        </header>

        <AdminPostFilters filters={filters} onChange={(next) => { setFilters(next); setPage(1); }} />

        <AdminPostTable
          posts={postsQuery.data?.posts ?? []}
          isLoading={postsQuery.isLoading}
          isMutating={updateStatus.isPending}
          onOpenPost={setSelectedPostId}
          onUpdateStatus={(id, status) =>
            updateStatus.mutate(
              { id, status },
              {
                onSuccess: () => toast.success(ADMIN_POSTS_TEXT.statusUpdated),
                onError: (error) => toast.error(error.message),
              }
            )
          }
        />

        <footer className="flex flex-col gap-3 rounded-lg border border-white/10 bg-zinc-950/70 p-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {pagination?.page ?? page} / {pagination?.totalPages ?? 1}
            {postsQuery.isFetching ? ` - ${ADMIN_POSTS_TEXT.loadingPosts}` : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!pagination?.hasPreviousPage} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <ChevronLeftIcon />
            </Button>
            <Button variant="outline" disabled={!pagination?.hasNextPage} onClick={() => setPage((value) => value + 1)}>
              <ChevronRightIcon />
            </Button>
          </div>
        </footer>
      </div>

      <AdminPostDetailModal
        open={Boolean(selectedPostId)}
        onOpenChange={(open) => {
          if (!open) setSelectedPostId(null);
        }}
        post={postDetailQuery.data}
        isLoading={postDetailQuery.isLoading}
      />
    </main>
  );
}
