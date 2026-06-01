"use client";

// src/components/post/PostActions.tsx
// Action bar: Like · Comment · Share · Save

import { useState, useCallback } from "react";
import { MessageCircle, Share2, Bookmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePostReactionMutations } from "@/hooks/posts/usePostReactionMutations";
import { usePostBookmarkMutations } from "@/hooks/posts/usePostBookmarkMutations";
import { usePostReactions } from "@/hooks/posts/usePostReactions";
import { usePostBookmarkState } from "@/hooks/posts/usePostBookmark";
import { ReactionButton, ReactionPicker } from "@/components/reaction";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { useAuth } from "@/providers/AuthProvider";
import type { ReactionType } from "@/types/api.types";

type PostActionsProps = {
  postId: string;
  reactionCount: number;
  commentCount: number;
  shareCount?: number;
  hasShared?: boolean;
  hasReacted: boolean;
  isSaved: boolean;
  onCommentClick?: () => void;
  onShareClick?: () => void;
  size?: "compact" | "default";
};



export function PostActions({
  postId,
  reactionCount,
  commentCount,
  shareCount = 0,
  hasShared = false,
  hasReacted: initialReacted,
  isSaved: initialSaved,
  onCommentClick,
  onShareClick,
  size = "default",
}: PostActionsProps) {
  const { profile } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { reactMutation, removeMutation } = usePostReactionMutations();
  const { saveMutation, unsaveMutation } = usePostBookmarkMutations();
  const reactionsQuery = usePostReactions(postId);
  const bookmarkQuery = usePostBookmarkState(postId);

  const reactionsLoading = reactionsQuery.isLoading || reactionsQuery.isFetching;
  const bookmarkLoading = bookmarkQuery.isLoading || bookmarkQuery.isFetching;
  const actionsLoading = reactionsLoading || bookmarkLoading;

  const [likeAnim, setLikeAnim] = useState(false);

  const serverReaction = reactionsQuery.data?.viewerReaction ?? null;
  const currentReaction = serverReaction ?? (initialReacted ? "like" : null);
  const serverBookmark = bookmarkQuery.data;
  const saved = serverBookmark ? Boolean(serverBookmark.saved) : initialSaved;
  const rxCount = reactionsQuery.data
    ? reactionsQuery.data.counts.total
    : reactionCount;

  const handleReactionSelect = useCallback(
    async (type: ReactionType) => {
      if (!profile) {
        setPickerOpen(false);
        return;
      }

      try {
        if (currentReaction === type) {
          await removeMutation.mutateAsync(postId);
        } else {
          await reactMutation.mutateAsync({ postId, type });
        }
      } catch {
        // mutation hook handles rollback via onError
      } finally {
        setPickerOpen(false);
      }
    },
    [currentReaction, postId, profile, reactMutation, removeMutation]
  );

  const handleLikeClick = useCallback(async () => {
    if (!profile) return;

    if (!currentReaction) {
      setLikeAnim(true);
      window.setTimeout(() => setLikeAnim(false), 600);
      try {
        await reactMutation.mutateAsync({ postId, type: "like" });
      } catch {
        // rollback handled in hook
      }
      return;
    }

    if (currentReaction === "like") {
      try {
        await removeMutation.mutateAsync(postId);
      } catch {
        // rollback handled in hook
      }
      return;
    }

    try {
      await reactMutation.mutateAsync({ postId, type: "like" });
    } catch {
      // rollback handled in hook
    }
  }, [currentReaction, postId, profile, reactMutation, removeMutation]);

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
      {actionsLoading ? (
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-1.5 rounded-lg",
                isCompact ? "px-2 py-1.5" : "px-3 py-2",
              )}
            >
              <Skeleton className={isCompact ? "h-3.5 w-3.5 rounded-full" : "h-4 w-4 rounded-full"} />
              <Skeleton className={isCompact ? "h-3 w-8" : "h-4 w-12"} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <ReactionPicker
            currentReaction={currentReaction}
            onSelect={handleReactionSelect}
            open={pickerOpen}
            onOpenChange={setPickerOpen}
          >
            <div onMouseEnter={() => setPickerOpen(true)} className="relative">
              <ReactionButton
                currentReaction={currentReaction}
                count={rxCount}
                isAnimating={likeAnim}
                onClick={handleLikeClick}
                compact={isCompact}
              />
            </div>
          </ReactionPicker>

          <ActionButton
            onClick={onCommentClick}
            label={`${formatNumber(commentCount)} bình luận`}
            compact={isCompact}
          >
            <MessageCircle
              className={cn(
                "text-[#8b8fa8] transition-colors",
                isCompact ? "w-4 h-4" : "w-5 h-5",
              )}
            />
            <span
              className={cn(
                "tabular-nums text-[#8b8fa8]",
                isCompact ? "text-xs" : "text-sm",
              )}
            >
              {formatNumber(commentCount)}
            </span>
          </ActionButton>

          <ActionButton
            onClick={onShareClick}
            active={hasShared}
            activeColor="text-[#f46d1b]"
            label={`${formatNumber(shareCount)} lượt chia sẻ`}
            compact={isCompact}
          >
            <Share2
              className={cn(
                "transition-all duration-200",
                isCompact ? "w-4 h-4" : "w-5 h-5",
                hasShared ? "fill-[#f46d1b] text-[#f46d1b] scale-110" : "text-[#8b8fa8]",
              )}
            />
            {shareCount > 0 && (
              <span
                className={cn(
                  "tabular-nums",
                  isCompact ? "text-xs" : "text-sm",
                  hasShared ? "text-[#f46d1b]" : "text-[#8b8fa8]",
                )}
              >
                {formatNumber(shareCount)}
              </span>
            )}
          </ActionButton>
        </div>
      )}

      {actionsLoading ? (
        <div className={cn("flex items-center", isCompact ? "px-2 py-1.5" : "px-3 py-2")}>
          <Skeleton className={isCompact ? "h-4 w-10" : "h-5 w-16 rounded-md"} />
        </div>
      ) : (
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
      )}
    </div>
  );
}

type ActionButtonProps = {
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
  label: string;
  compact: boolean;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

function ActionButton({
  onClick,
  active,
  activeColor = "",
  label,
  compact,
  className,
  children,
  disabled,
  onMouseEnter,
  onMouseLeave,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
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
