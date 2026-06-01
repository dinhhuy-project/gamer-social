"use client";

import { EyeIcon, MessageCircleIcon, ThumbsUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_POSTS_TEXT } from "@/components/admin/posts/admin-posts.constants";
import { ListingStatusBadge } from "@/components/admin/posts/ListingStatusBadge";
import { PostTypeBadge } from "@/components/admin/posts/PostTypeBadge";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils/format";

import type { AdminPostDetail } from "@/types/api.types";

type AdminPostDetailModalProps = {
  post: AdminPostDetail | undefined;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DetailSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="h-28 rounded-lg" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof EyeIcon }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
        <Icon className="size-4 text-cyan-300" />
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

export function AdminPostDetailModal({ post, isLoading, open, onOpenChange }: AdminPostDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{ADMIN_POSTS_TEXT.postDetails}</DialogTitle>
          <DialogDescription>{post ? `@${post.author.username} - ${formatDateTime(post.createdAt)}` : ""}</DialogDescription>
        </DialogHeader>

        {isLoading || !post ? (
          <DetailSkeleton />
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <PostTypeBadge type={post.postType} />
              <ListingStatusBadge status={post.listingStatus} />
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-white/10 bg-white/5 text-zinc-300">
                  #{tag}
                </Badge>
              ))}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/30 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                {post.content ?? ADMIN_POSTS_TEXT.noContent}
              </p>
            </div>

            {post.mediaUrls.length ? (
              <section className="grid gap-3">
                <h3 className="text-sm font-medium text-white">{ADMIN_POSTS_TEXT.mediaGallery}</h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {post.mediaUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="" className="aspect-video rounded-lg border border-white/10 object-cover" />
                  ))}
                </div>
              </section>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat label={ADMIN_POSTS_TEXT.reactions} value={formatNumber(post.reactionsCount)} icon={ThumbsUpIcon} />
              <Stat label={ADMIN_POSTS_TEXT.comments} value={formatNumber(post.commentsCount)} icon={MessageCircleIcon} />
              <Stat label="Views" value={formatNumber(post.viewCount)} icon={EyeIcon} />
            </div>

            {post.postType === "marketplace" ? (
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
                <h3 className="text-sm font-medium text-white">{ADMIN_POSTS_TEXT.listingInfo}</h3>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300">
                  <div>{post.gameName ?? "-"}</div>
                  <div>{post.listingPrice != null ? formatCurrency(post.listingPrice) : "-"}</div>
                  <div>{post.listingReviewedAt ? formatDateTime(post.listingReviewedAt) : "-"}</div>
                  {post.rejectReason ? (
                    <div className="rounded-md border border-rose-400/20 bg-rose-400/10 p-2 text-rose-100">
                      {post.rejectReason}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
