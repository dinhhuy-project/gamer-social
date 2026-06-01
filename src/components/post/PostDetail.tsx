"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostShareModal } from "./PostShareModal";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";
import { ROUTES } from "@/lib/constants/routes";
import type { Post } from "@/types/post.types";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTrackPostView } from "@/hooks/posts/useTrackPostView";
import { PostCard } from "./PostCard";

type Tag = { id: number; name: string; slug: string };

type PostDetailProps = {
  post: Post;
  hasReacted?: boolean;
  isSaved?: boolean;
  availableTags?: Tag[];
};

export function PostDetail({
  post
}: PostDetailProps) {
  const [shareOpen, setShareOpen] = useState(false);

  useTrackPostView(post.id);

  const scrollToComments = () => {
    const el = document.getElementById("comments");
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      // ignore
    }
    // add highlight class for a brief animation
    el.classList.remove("comment-highlight");
    // force reflow to restart animation
    void el.offsetWidth;
    el.classList.add("comment-highlight");
    window.setTimeout(() => el.classList.remove("comment-highlight"), 1400);
  };

  const commentCount = (post as any).commentCount ?? (post as any)._count?.comments ?? 0;

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <Link
          href={ROUTES.feed}
          className="inline-flex items-center gap-2 text-[#8b8fa8] hover:text-white text-sm mb-4 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Quay lại feed
        </Link>

        <PostCard
          key={post.id}
          post={post as any}
          hasReacted={false}
          isSaved={false}
          onCommentClick={scrollToComments}
        />

        {/* Comments */}
        <div className="mt-6" id="comments">
          <h3 className="text-sm font-semibold mb-3">Bình luận ({commentCount})</h3>

          <Card size="sm">
            <CardContent>
              <CommentForm postId={post.id} onSubmit={() => { }} />
            </CardContent>

            <Separator />

            <CardContent>
              <CommentList postId={post.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      <PostShareModal open={shareOpen} onClose={() => setShareOpen(false)} postId={post.id} />
    </>
  );
}

export default PostDetail;
