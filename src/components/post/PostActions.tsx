"use client";

// src/components/post/PostActions.tsx
// Action bar: Like · Comment · Share · Save

import { useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { usePostReactionMutations } from "@/hooks/posts/usePostReactionMutations";
import { usePostBookmarkMutations } from "@/hooks/posts/usePostBookmarkMutations";
import { usePostReactions } from "@/hooks/posts/usePostReactions";
import { usePostBookmarkState } from "@/hooks/posts/usePostBookmark";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { useAuth } from "@/providers/AuthProvider";

type PostActionsProps = {
  postId: string;
  reactionCount: number;
  commentCount: number;
  shareCount?: number;
  hasReacted: boolean;
  isSaved: boolean;
  onCommentClick?: () => void;
  onShareClick?: () => void;
  // compact = action bar nhỏ trong card; default = full size trong detail
  size?: "compact" | "default";
};

export function PostActions({
  postId,
  reactionCount,
  commentCount,
  shareCount = 0,
  hasReacted: initialReacted,
  isSaved: initialSaved,
  onCommentClick,
  onShareClick,
  size = "default",
}: PostActionsProps) {
  const { profile } = useAuth();

  const { reactMutation, removeMutation } = usePostReactionMutations();
  const { saveMutation, unsaveMutation } = usePostBookmarkMutations();
  const reactionsQuery = usePostReactions(postId);
  const bookmarkQuery = usePostBookmarkState(postId);

  // Animation state
  const [likeAnim, setLikeAnim] = useState(false);

  // derive current server-backed state (hooks provide optimistic updates)
  const serverReactions = reactionsQuery.data;
  const serverBookmark = bookmarkQuery.data;
  const reacted = serverReactions ? Boolean(serverReactions.viewerReaction) : initialReacted;
  const saved = serverBookmark ? Boolean(serverBookmark.saved) : initialSaved;
  const rxCount = serverReactions ? (serverReactions.counts?.total ?? reactionCount) : reactionCount;

  const handleReact = useCallback(async () => {
    if (!profile) return;
    const wasReacted = reactionsQuery.data ? Boolean(reactionsQuery.data.viewerReaction) : initialReacted;
    if (!wasReacted) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 600);
      try {
        await reactMutation.mutateAsync({ postId, type: "like" });
      } catch {
        // mutation hook handles rollback via onError
      }
    } else {
      try {
        await removeMutation.mutateAsync(postId);
      } catch {
        // rollback handled in hook
      }
    }
  }, [postId, reactionsQuery.data, initialReacted, profile, reactMutation, removeMutation]);


  const handleSave = useCallback(async () => {
    if (!profile) return;

    const wasSaved = bookmarkQuery.data ? Boolean(bookmarkQuery.data.saved) : initialSaved;
    try {
      if (!wasSaved) {
        await saveMutation.mutateAsync(postId);
      } else {
        await unsaveMutation.mutateAsync(postId);
      }
    } catch {
      // rollback handled in hook
    }
  }, [postId, bookmarkQuery.data, initialSaved, profile, saveMutation, unsaveMutation]);

  const isCompact = size === "compact";

  return (
    <div className={cn(
      "flex items-center justify-between",
      isCompact ? "pt-3" : "pt-4",
    )}>
      {/* Left group: Like · Comment · Share */}
      <div className="flex items-center gap-1">
        {/* Like */}
        <ActionButton
          onClick={handleReact}
          active={reacted}
          activeColor="text-rose-500"
          label={`${formatNumber(rxCount)} lượt thích`}
          compact={isCompact}
          className={cn(likeAnim && "animate-bounce-once")}
        >
          <Heart
            className={cn(
              "transition-all duration-200",
              isCompact ? "w-4 h-4" : "w-5 h-5",
              reacted ? "fill-rose-500 text-rose-500 scale-110" : "text-[#8b8fa8]",
            )}
          />
          <span className={cn(
            "tabular-nums transition-colors",
            isCompact ? "text-xs" : "text-sm",
            reacted ? "text-rose-500" : "text-[#8b8fa8]",
          )}>
            {formatNumber(rxCount)}
          </span>
        </ActionButton>

        {/* Comment */}
        <ActionButton
          onClick={onCommentClick}
          label={`${formatNumber(commentCount)} bình luận`}
          compact={isCompact}
        >
          <MessageCircle className={cn(
            "text-[#8b8fa8] transition-colors",
            isCompact ? "w-4 h-4" : "w-5 h-5",
          )} />
          <span className={cn(
            "tabular-nums text-[#8b8fa8]",
            isCompact ? "text-xs" : "text-sm",
          )}>
            {formatNumber(commentCount)}
          </span>
        </ActionButton>

        {/* Share */}
        <ActionButton
          onClick={onShareClick}
          label={`${formatNumber(shareCount)} lượt chia sẻ`}
          compact={isCompact}
        >
          <Share2 className={cn(
            "text-[#8b8fa8] transition-colors",
            isCompact ? "w-4 h-4" : "w-5 h-5",
          )} />
          {shareCount > 0 && (
            <span className={cn(
              "tabular-nums text-[#8b8fa8]",
              isCompact ? "text-xs" : "text-sm",
            )}>
              {formatNumber(shareCount)}
            </span>
          )}
        </ActionButton>
      </div>

      {/* Right: Save */}
      <ActionButton
        onClick={handleSave}
        active={saved}
        activeColor="text-[#f46d1b]"
        label={saved ? "Bỏ lưu bài" : "Lưu bài"}
        compact={isCompact}
      >
        <Bookmark
          className={cn(
            "transition-all duration-200",
            isCompact ? "w-4 h-4" : "w-5 h-5",
            saved
              ? "fill-[#f46d1b] text-[#f46d1b] scale-110"
              : "text-[#8b8fa8]",
          )}
        />
      </ActionButton>
    </div>
  );
}

// ── Reusable action button ──────────────────────────────────
type ActionButtonProps = {
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
  label: string;
  compact: boolean;
  className?: string;
  children: React.ReactNode;
};

function ActionButton({
  onClick, active, activeColor = "", label,
  compact, className, children,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-lg transition-all duration-150",
        "hover:bg-white/5 active:scale-95",
        compact ? "px-2 py-1.5" : "px-3 py-2",
        active && activeColor,
        className,
      )}
    >
      {children}
    </button>
  );
}
