"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon, StoreIcon } from "lucide-react";
import { toast } from "sonner";

import { AdminPostDetailModal } from "@/components/admin/posts/AdminPostDetailModal";
import { AdminPostFilters, type AdminPostFilterState } from "@/components/admin/posts/AdminPostFilters";
import { AdminPostTable } from "@/components/admin/posts/AdminPostTable";
import { ADMIN_POSTS_TEXT } from "@/components/admin/posts/admin-posts.constants";
import { ListingReviewModal } from "@/components/admin/posts/ListingReviewModal";
import { ListingStatusBadge } from "@/components/admin/posts/ListingStatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import { useAdminPost, useUpdateAdminPostStatus } from "@/hooks/admin/useAdminPost";
import { useMarketplaceListings } from "@/hooks/admin/useMarketplaceListings";
import { useReviewListing } from "@/hooks/admin/useReviewListing";

import type { ListingStatus } from "@/types/api.types";

const PAGE_SIZE = 20;
const listingTabs: Array<"all" | ListingStatus> = ["all", "pending_review", "approved", "rejected", "sold"];

const initialFilters: AdminPostFilterState = {
  search: "",
  postType: "marketplace",
  status: "all",
  listingStatus: "pending_review",
};

export default function AdminListingsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectPostId, setRejectPostId] = useState<string | null>(null);

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
      status: filters.status,
      listingStatus: filters.listingStatus,
      page,
      limit: PAGE_SIZE,
    }),
    [debouncedSearch, filters.listingStatus, filters.status, page]
  );

  const listingsQuery = useMarketplaceListings(queryFilters);
  const selectedListPostId = selectedPostId ?? listingsQuery.data?.posts[0]?.id ?? null;
  const postDetailQuery = useAdminPost(selectedListPostId);
  const updateStatus = useUpdateAdminPostStatus();
  const reviewListing = useReviewListing();
  const pagination = listingsQuery.data?.pagination;
  const selectedPost = postDetailQuery.data;

  function handleReview(id: string, action: "approve" | "reject", rejectReason?: string) {
    reviewListing.mutate(
      { id, action, rejectReason },
      {
        onSuccess: () => {
          toast.success(ADMIN_POSTS_TEXT.listingReviewed);
          setRejectPostId(null);
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_30%),linear-gradient(180deg,#09090b,#18181b)] px-4 py-6 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100">
              <StoreIcon className="size-4" />
              {ADMIN_POSTS_TEXT.listingsTitle}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-normal text-white md:text-3xl">
              {ADMIN_POSTS_TEXT.listingsTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">{ADMIN_POSTS_TEXT.listingsDescription}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="border-cyan-400/20 bg-black/30 text-cyan-100 hover:bg-cyan-400/10">
              <Link href="/feed">
                <HomeIcon />
                {ADMIN_POSTS_TEXT.backToHomePage}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/posts">{ADMIN_POSTS_TEXT.postsTitle}</Link>
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {listingTabs.map((tab) => (
            <Button
              key={tab}
              variant={filters.listingStatus === tab ? "default" : "outline"}
              onClick={() => {
                setFilters((current) => ({ ...current, listingStatus: tab }));
                setPage(1);
              }}
            >
              {tab === "all" ? ADMIN_POSTS_TEXT.all : ADMIN_POSTS_TEXT[tab]}
            </Button>
          ))}
        </div>

        <AdminPostFilters
          filters={filters}
          hidePostType
          onChange={(next) => {
            setFilters({ ...next, postType: "marketplace" });
            setPage(1);
          }}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <AdminPostTable
            posts={listingsQuery.data?.posts ?? []}
            isLoading={listingsQuery.isLoading}
            isMutating={reviewListing.isPending || updateStatus.isPending}
            reviewMode
            onOpenPost={(id) => {
              setSelectedPostId(id);
              setDetailOpen(true);
            }}
            onApproveListing={(id) => handleReview(id, "approve")}
            onRejectListing={setRejectPostId}
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

          <aside className="sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-y-auto rounded-lg border border-white/10 bg-zinc-950/80 p-4 xl:block">
            {selectedPost ? (
              <div className="grid gap-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-white">@{selectedPost.author.username}</h2>
                  <ListingStatusBadge status={selectedPost.listingStatus} />
                </div>
                {selectedPost.mediaUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedPost.mediaUrls[0]} alt="" className="aspect-video rounded-lg border border-white/10 object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg border border-white/10 bg-black/30 text-zinc-500">
                    {ADMIN_POSTS_TEXT.mediaGallery}
                  </div>
                )}
                <p className="line-clamp-5 text-sm leading-6 text-zinc-300">
                  {selectedPost.content ?? ADMIN_POSTS_TEXT.noContent}
                </p>
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-zinc-300">
                  <div className="font-medium text-white">{selectedPost.gameName ?? "-"}</div>
                  <div className="mt-1 text-cyan-200">
                    {selectedPost.listingPrice != null ? formatCurrency(selectedPost.listingPrice) : "-"}
                  </div>
                </div>
                {selectedPost.listingStatus === "pending_review" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button disabled={reviewListing.isPending} onClick={() => handleReview(selectedPost.id, "approve")}>
                      {ADMIN_POSTS_TEXT.approve}
                    </Button>
                    <Button variant="destructive" disabled={reviewListing.isPending} onClick={() => setRejectPostId(selectedPost.id)}>
                      {ADMIN_POSTS_TEXT.reject}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-zinc-500">{ADMIN_POSTS_TEXT.noPosts}</div>
            )}
          </aside>
        </div>

        <footer className="flex flex-col gap-3 rounded-lg border border-white/10 bg-zinc-950/70 p-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {pagination?.page ?? page} / {pagination?.totalPages ?? 1}
            {listingsQuery.isFetching ? ` - ${ADMIN_POSTS_TEXT.loadingPosts}` : ""}
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
        open={detailOpen}
        onOpenChange={setDetailOpen}
        post={postDetailQuery.data}
        isLoading={postDetailQuery.isLoading}
      />
      <ListingReviewModal
        open={Boolean(rejectPostId)}
        onOpenChange={(open) => {
          if (!open) setRejectPostId(null);
        }}
        isPending={reviewListing.isPending}
        onReject={(reason) => {
          if (rejectPostId) handleReview(rejectPostId, "reject", reason);
        }}
      />
    </main>
  );
}
