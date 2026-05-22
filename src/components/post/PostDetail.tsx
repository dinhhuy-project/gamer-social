"use client";

// src/components/post/PostDetail.tsx
// View chi tiết đầy đủ của 1 bài viết: nội dung + comments

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, ShieldCheck, Crown } from "lucide-react";
import { PostMedia } from "./PostMedia";
import { PostActions } from "./PostActions";
import { PostTagList } from "./PostTagList";
import { PostShareModal } from "./PostShareModal";
import { PostForm } from "./PostForm";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";
import { formatNumber } from "@/lib/utils/format";
import { useAuth } from "@/providers/AuthProvider";
import { ROUTES } from "@/lib/constants/routes";
import type { Post } from "@/types/post.types";

type Tag = { id: number; name: string; slug: string };

type PostDetailProps = {
  post: Post;
  hasReacted?: boolean;
  isSaved?: boolean;
  availableTags?: Tag[];
};

export function PostDetail({
  post,
  hasReacted = false,
  isSaved = false,
  availableTags = [],
}: PostDetailProps) {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isOwner = profile?.id === post.author.id;

  return (
    <>
      <div className="max-w-2xl mx-auto">
        {/* ── Back button ───────────────────────────────── */}
        <Link
          href={ROUTES.feed}
          className="inline-flex items-center gap-2 text-[#8b8fa8] hover:text-white text-sm mb-4 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Quay lại feed
        </Link>

        <article className="bg-[#1e2128] rounded-2xl border border-[#2e3240]/60 overflow-hidden">
          <div className="p-5 md:p-6">
            {/* ── Edit mode ─────────────────────────────── */}
            {isEditing ? (
              <PostForm
                editPost={post as any}
                availableTags={availableTags}
                onSuccess={() => { setIsEditing(false); window.location.reload(); }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                {/* ── Author header ───────────────────────── */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <Link href={ROUTES.profile(post.author.username)} className="flex-shrink-0">
                      <div className={cn(
                        "w-12 h-12 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-[#1e2128]",
                        post.author.role === "admin" && "ring-red-500",
                        post.author.role === "member" && "ring-[#f46d1b]",
                        post.author.role === "user" && "ring-[#3e4255]",
                      )}>
                        {post.author.avatarUrl ? (
                          <Image
                            src={post.author.avatarUrl}
                            alt={post.author.displayName ?? post.author.username}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <AvatarFallback name={post.author.displayName ?? post.author.username} />
                        )}
                      </div>
                    </Link>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={ROUTES.profile(post.author.username)}
                          className="font-semibold text-white hover:underline"
                        >
                          {post.author.displayName ?? post.author.username}
                        </Link>
                        {post.author.role === "member" && (
                          <ShieldCheck className="w-4 h-4 text-[#f46d1b]" aria-label="Hội viên" />
                        )}
                        {post.author.role === "admin" && (
                          <Crown className="w-4 h-4 text-red-500" aria-label="Admin" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-[#8b8fa8] mt-0.5">
                        {post.postTags.length > 0 && (
                          <PostTagList tags={post.postTags} variant="inline" />
                        )}
                        {post.postTags.length > 0 && <span>•</span>}
                        <span>{formatDateTime(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Edit button */}
                  {isOwner && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[#8b8fa8] hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>

                {/* ── Content ─────────────────────────────── */}
                {post.content && (
                  <p className="text-[#c9cdd8] text-base leading-relaxed mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}

                {/* ── Tag pills ───────────────────────────── */}
                {post.postTags.length > 0 && (
                  <PostTagList tags={post.postTags} variant="pill" className="mb-4" />
                )}

                {/* ── Media ───────────────────────────────── */}
                <PostMedia mediaUrls={post.mediaUrls} postId={post.id} />

                {/* ── Marketplace info ────────────────────── */}
                {post.postType === "marketplace" && post.listingPrice && (
                  <div className="mt-4 bg-[#12131a] rounded-xl border border-[#2e3240] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        {post.gameName && (
                          <p className="text-[#8b8fa8] text-sm">{post.gameName}</p>
                        )}
                        <p className="text-[#f46d1b] font-bold text-2xl">
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(post.listingPrice)}
                        </p>
                      </div>
                      {post.listingStatus === "approved" && profile?.role === "member" && profile.id !== post.author.id && (
                        <Link
                          href={ROUTES.marketplace}
                          className="px-5 py-2.5 rounded-xl bg-[#f46d1b] hover:bg-[#e05c0a] text-white font-semibold text-sm transition-colors"
                        >
                          Liên hệ ngay
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Stats ───────────────────────────────── */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#2e3240] text-sm text-[#8b8fa8]">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {formatNumber(post.viewCount)} lượt xem
                  </span>
                </div>

                {/* ── Actions ─────────────────────────────── */}
                <PostActions
                  postId={post.id}
                  reactionCount={post._count.reactions}
                  commentCount={post._count.comments}
                  hasReacted={hasReacted}
                  isSaved={isSaved}
                  size="default"
                  onCommentClick={() => {
                    document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  onShareClick={() => setShareOpen(true)}
                />
              </>
            )}
          </div>
        </article>
      </div>

      <PostShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        postId={post.id}
      />
    </>
  );
}

function AvatarFallback({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = name.charCodeAt(0) * 7 % 360;
  return (
    <div
      className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
      style={{ background: `hsl(${hue}, 55%, 35%)` }}
    >
      {initials}
    </div>
  );
}
