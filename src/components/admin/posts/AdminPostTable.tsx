"use client";

import { BanIcon, CheckIcon, EyeIcon, ImageIcon, Trash2Icon, XIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_POSTS_TEXT } from "@/components/admin/posts/admin-posts.constants";
import { ListingStatusBadge } from "@/components/admin/posts/ListingStatusBadge";
import { PostTypeBadge } from "@/components/admin/posts/PostTypeBadge";
import { formatDateTime, formatNumber } from "@/lib/utils/format";

import type { AdminPostListItem, PostStatus } from "@/types/api.types";

type AdminPostTableProps = {
  posts: AdminPostListItem[];
  isLoading: boolean;
  isMutating?: boolean;
  onOpenPost: (id: string) => void;
  onUpdateStatus: (id: string, status: PostStatus) => void;
  onApproveListing?: (id: string) => void;
  onRejectListing?: (id: string) => void;
  reviewMode?: boolean;
};

function initials(value: string) {
  return value.slice(0, 2).toUpperCase();
}

function StatusBadge({ status }: { status: PostStatus }) {
  const className = {
    active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    hidden: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    deleted: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  }[status];

  return (
    <Badge variant="outline" className={className}>
      {ADMIN_POSTS_TEXT[status]}
    </Badge>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <TableRow key={index} className="border-white/10">
          {Array.from({ length: 11 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-5 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function AdminPostTable({
  posts,
  isLoading,
  isMutating,
  onOpenPost,
  onUpdateStatus,
  onApproveListing,
  onRejectListing,
  reviewMode,
}: AdminPostTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950/80 shadow-2xl shadow-cyan-950/10">
      <Table>
        <TableHeader className="bg-white/[0.03]">
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead>{ADMIN_POSTS_TEXT.author}</TableHead>
            <TableHead>{ADMIN_POSTS_TEXT.content}</TableHead>
            <TableHead>{ADMIN_POSTS_TEXT.media}</TableHead>
            <TableHead>{ADMIN_POSTS_TEXT.tags}</TableHead>
            <TableHead>{ADMIN_POSTS_TEXT.postType}</TableHead>
            <TableHead>{ADMIN_POSTS_TEXT.status}</TableHead>
            <TableHead>{ADMIN_POSTS_TEXT.listingStatus}</TableHead>
            <TableHead className="text-right">{ADMIN_POSTS_TEXT.reactions}</TableHead>
            <TableHead className="text-right">{ADMIN_POSTS_TEXT.comments}</TableHead>
            <TableHead>{ADMIN_POSTS_TEXT.createdAt}</TableHead>
            <TableHead className="text-right">{ADMIN_POSTS_TEXT.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : posts.length === 0 ? (
            <TableRow className="border-white/10">
              <TableCell colSpan={11} className="h-36 text-center">
                <div className="mx-auto grid max-w-sm gap-1 text-zinc-400">
                  <p className="font-medium text-zinc-200">{ADMIN_POSTS_TEXT.noPosts}</p>
                  <p className="text-sm">{ADMIN_POSTS_TEXT.noPostsDescription}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
              <TableRow
                key={post.id}
                className="cursor-pointer border-white/10 text-zinc-200 hover:bg-cyan-500/5"
                onClick={() => onOpenPost(post.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="ring-1 ring-cyan-400/20">
                      <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.username} />
                      <AvatarFallback>{initials(post.author.username)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white">@{post.author.username}</div>
                      <div className="truncate text-xs text-zinc-500">{post.author.displayName}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-72">
                  <p className="line-clamp-2 whitespace-normal text-zinc-300">
                    {post.contentPreview ?? ADMIN_POSTS_TEXT.noContent}
                  </p>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    <ImageIcon className="size-4 text-cyan-300" />
                    {post.mediaCount}
                  </span>
                </TableCell>
                <TableCell className="max-w-44">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.length ? post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="border-white/10 bg-white/5 text-zinc-300">
                        #{tag}
                      </Badge>
                    )) : <span className="text-zinc-500">{ADMIN_POSTS_TEXT.noTags}</span>}
                  </div>
                </TableCell>
                <TableCell><PostTypeBadge type={post.postType} /></TableCell>
                <TableCell><StatusBadge status={post.status} /></TableCell>
                <TableCell><ListingStatusBadge status={post.listingStatus} /></TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(post.reactionsCount)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(post.commentsCount)}</TableCell>
                <TableCell>{formatDateTime(post.createdAt)}</TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => onOpenPost(post.id)} aria-label={ADMIN_POSTS_TEXT.viewDetails}>
                      <EyeIcon />
                    </Button>
                    {reviewMode && post.listingStatus === "pending_review" ? (
                      <>
                        <Button variant="outline" size="icon-sm" disabled={isMutating} onClick={() => onApproveListing?.(post.id)} aria-label={ADMIN_POSTS_TEXT.approve}>
                          <CheckIcon />
                        </Button>
                        <Button variant="destructive" size="icon-sm" disabled={isMutating} onClick={() => onRejectListing?.(post.id)} aria-label={ADMIN_POSTS_TEXT.reject}>
                          <XIcon />
                        </Button>
                      </>
                    ) : null}
                    <Button variant="outline" size="icon-sm" disabled={isMutating || post.status === "hidden"} onClick={() => onUpdateStatus(post.id, "hidden")} aria-label={ADMIN_POSTS_TEXT.hide}>
                      <BanIcon />
                    </Button>
                    <Button variant="destructive" size="icon-sm" disabled={isMutating || post.status === "deleted"} onClick={() => onUpdateStatus(post.id, "deleted")} aria-label={ADMIN_POSTS_TEXT.softDelete}>
                      <Trash2Icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
