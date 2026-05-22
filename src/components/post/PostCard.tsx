"use client";

// src/components/post/PostCard.tsx
// Card bài đăng trong feed — khớp với design trong ảnh

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal, ShieldCheck, Crown, Pencil, Trash2, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostMedia } from "./PostMedia";
import { PostActions } from "./PostActions";
import { PostTagList } from "./PostTagList";
import { PostShareModal } from "./PostShareModal";
import { cn } from "@/lib/utils/cn";
import { formatTimeAgo } from "@/lib/utils/format";
import { useAuth } from "@/providers/AuthProvider";
import { usePostMutations } from "@/hooks/posts/usePostMutations";
import { ROUTES } from "@/lib/constants/routes";
import type { Post } from "@/types/post.types";

type PostCardProps = {
  post: Post;
  hasReacted?: boolean;
  isSaved?: boolean;
  onDeleted?: (id: string) => void;
};

export function PostCard({
  post,
  hasReacted = false,
  isSaved = false,
  onDeleted,
}: PostCardProps) {
  const { profile } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  const isOwner = profile?.id === post.author.id;
  const isAdmin = profile?.role === "admin";
  const { deleteMutation, hideMutation } = usePostMutations();

  // Support both legacy `post.postTags` and new API `post.tagNames` (array of strings)
  const postTags = (post as any).postTags as any[] | undefined;
  const tagNames = (post as any).tagNames as string[] | undefined;
  const tagIds = (post as any).tagIds as number[] | undefined; // fallback for older responses
  const hasTags =
    (Array.isArray(postTags) && postTags.length > 0) ||
    (Array.isArray(tagNames) && tagNames.length > 0) ||
    (Array.isArray(tagIds) && tagIds.length > 0);

  if (hidden) return null;

  async function handleDelete() {
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await deleteMutation.mutateAsync(post.id);
      onDeleted?.(post.id);
    } catch {/* toast error */ }
  }

  async function handleHide() {
    try {
      await hideMutation.mutateAsync(post.id);
      setHidden(true);
    } catch {/* toast error */ }
  }

  return (
    <>
      <article className={cn(
        "bg-[#1e2128] rounded-2xl overflow-hidden",
        "border border-[#2e3240]/60",
        "hover:border-[#3e4255]/80 transition-colors duration-200",
        "group",
      )}>
        <div className="p-4">
          {/* ── Header ──────────────────────────────────── */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <Link
                href={ROUTES.profile(post.author.username)}
                className="flex-shrink-0 relative"
              >
                <div className={cn(
                  "w-10 h-10 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-[#1e2128]",
                  post.author.role === "admin" && "ring-red-500",
                  post.author.role === "member" && "ring-[#f46d1b]",
                  post.author.role === "user" && "ring-transparent",
                )}>
                  {post.author.avatarUrl ? (
                    <Image
                      src={post.author.avatarUrl}
                      alt={post.author.displayName ?? post.author.username}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <AvatarFallback name={post.author.displayName ?? post.author.username} />
                  )}
                </div>
              </Link>

              {/* Name + tag + time */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={ROUTES.profile(post.author.username)}
                    className="font-semibold text-white text-sm hover:underline truncate"
                  >
                    {post.author.displayName ?? post.author.username}
                  </Link>

                  {/* Role badge */}
                  {post.author.role === "member" && (
                    <span title="Hội viên">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#f46d1b]" />
                    </span>
                  )}
                  {post.author.role === "admin" && (
                    <span title="Admin">
                      <Crown className="w-3.5 h-3.5 text-red-500" />
                    </span>
                  )}
                </div>

                {/* "Posted in Tag • time" */}
                <div className="flex items-center gap-1.5 text-xs mt-0.5">
                  {Array.isArray(postTags) && postTags.length > 0 ? (
                    <PostTagList tags={postTags} variant="inline" />
                  ) : Array.isArray(tagNames) && tagNames.length > 0 ? (
                    <span className="text-[#8b8fa8] text-sm">
                      Posted in{" "}
                      {tagNames.slice(0, 2).map((name, i) => (
                        <span key={name}>
                          <Link
                            href={`/explore?tag=${encodeURIComponent(name)}`}
                            className="text-[#f46d1b] hover:underline hover:text-[#ff8533] transition-colors"
                          >
                            #{name}
                          </Link>
                          {i < Math.min(tagNames.length, 2) - 1 && ", "}
                        </span>
                      ))}
                      {tagNames.length > 2 && (
                        <span className="text-[#8b8fa8]"> +{tagNames.length - 2}</span>
                      )}
                    </span>
                  ) : Array.isArray(tagIds) && tagIds.length > 0 ? (
                    <span className="text-[#8b8fa8] text-sm">
                      Posted in{" "}
                      {tagIds.slice(0, 2).map((id, i) => (
                        <span key={id}>
                          <Link
                            href={`/explore?tag=${id}`}
                            className="text-[#f46d1b] hover:underline hover:text-[#ff8533] transition-colors"
                          >
                            #{id}
                          </Link>
                          {i < Math.min(tagIds.length, 2) - 1 && ", "}
                        </span>
                      ))}
                      {tagIds.length > 2 && (
                        <span className="text-[#8b8fa8]"> +{tagIds.length - 2}</span>
                      )}
                    </span>
                  ) : null}

                  {hasTags && (
                    <span className="text-[#8b8fa8]">•</span>
                  )}

                  <span className="text-[#8b8fa8]">{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* More menu */}
            {(isOwner || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex-shrink-0 p-1.5 rounded-lg text-[#8b8fa8] hover:text-white hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#2b2f3a] border-[#3e4255] text-white min-w-[150px]"
                >
                  {isOwner && (
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                    >
                      <Link href={`${ROUTES.post(post.id)}?edit=1`} className="flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5" />
                        Chỉnh sửa
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleHide}
                    className="cursor-pointer hover:bg-white/5 focus:bg-white/5 flex items-center gap-2"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Ẩn bài
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#3e4255]" />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa bài
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* ── Content ─────────────────────────────────── */}
          {post.content && (
            <Link href={ROUTES.post(post.id)} className="block group/content">
              <PostContent content={post.content} />
            </Link>
          )}

          {/* ── Media ───────────────────────────────────── */}
          <PostMedia mediaUrls={post.mediaUrls} postId={post.id} />

          {/* ── Marketplace badge ───────────────────────── */}
          {post.postType === "marketplace" && post.listingPrice && (
            <MarketplaceBadge
              price={post.listingPrice}
              gameName={post.gameName}
              status={post.listingStatus}
            />
          )}

          {/* ── Actions ─────────────────────────────────── */}
          <PostActions
            postId={post.id}
            reactionCount={(post as any)._count?.reactions ?? 0}
            commentCount={(post as any)._count?.comments ?? 0}
            hasReacted={hasReacted}
            isSaved={isSaved}
            size="compact"
            onCommentClick={() => {
              window.location.href = ROUTES.post(post.id) + "#comments";
            }}
            onShareClick={() => setShareOpen(true)}
          />
        </div>
      </article>

      <PostShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        postId={post.id}
      />
    </>
  );
}

// ── Post content with "Xem thêm" expand ─────────────────────
function PostContent({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_CHARS = 280;
  const isLong = content.length > MAX_CHARS;
  const displayed = isLong && !expanded ? content.slice(0, MAX_CHARS) : content;

  return (
    <p className="text-[#c9cdd8] text-sm leading-relaxed mb-0.5">
      {displayed}
      {isLong && !expanded && (
        <>
          {"... "}
          <button
            onClick={(e) => { e.preventDefault(); setExpanded(true); }}
            className="text-[#f46d1b] hover:underline font-medium"
          >
            Xem thêm
          </button>
        </>
      )}
    </p>
  );
}

// ── Avatar fallback initials ─────────────────────────────────
function AvatarFallback({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = name.charCodeAt(0) * 7 % 360;

  return (
    <div
      className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
      style={{ background: `hsl(${hue}, 55%, 35%)` }}
    >
      {initials}
    </div>
  );
}

// ── Marketplace price badge ──────────────────────────────────
function MarketplaceBadge({
  price, gameName, status,
}: {
  price: number;
  gameName: string | null | undefined;
  status: string | null | undefined;
}) {
  const statusColor = {
    approved: "text-green-400 bg-green-400/10 border-green-400/20",
    pending_review: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    sold: "text-[#8b8fa8] bg-white/5 border-white/10 line-through",
    rejected: "text-red-400 bg-red-400/10 border-red-400/20",
  }[status ?? ""] ?? "text-[#8b8fa8] bg-white/5 border-white/10";

  const statusLabel = {
    approved: "Đã duyệt",
    pending_review: "Chờ duyệt",
    sold: "Đã bán",
    rejected: "Từ chối",
  }[status ?? ""] ?? "";

  return (
    <div className="mt-3 flex items-center justify-between rounded-xl bg-[#12131a] border border-[#2e3240] px-4 py-3">
      <div>
        {gameName && (
          <p className="text-[#8b8fa8] text-xs mb-0.5">{gameName}</p>
        )}
        <p className="text-[#f46d1b] font-bold text-lg">
          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)}
        </p>
      </div>
      {status && (
        <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", statusColor)}>
          {statusLabel}
        </span>
      )}
    </div>
  );
}
