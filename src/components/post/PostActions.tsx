"use client";

// src/components/post/PostActions.tsx
// Action bar: Like · Comment · Share · Save

import { useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { usePostReactionMutations } from "@/hooks/posts/usePostReactionMutations";
import { usePostBookmarkMutations } from "@/hooks/posts/usePostBookmarkMutations";
import { usePostReactions } from "@/hooks/posts/usePostReactions";
import { usePostBookmarkState } from "@/hooks/posts/usePostBookmark";
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

const REACTION_OPTIONS: Array<{
  type: ReactionType;
  emoji: string;
  label: string;
}> = [
    { type: "like", emoji: "👍", label: "Thích" },
    { type: "love", emoji: "❤️", label: "Yêu thích" },
    { type: "haha", emoji: "😂", label: "Haha" },
    { type: "wow", emoji: "😮", label: "Wow" },
    { type: "sad", emoji: "😢", label: "Buồn" },
    { type: "angry", emoji: "😠", label: "Phẫn nộ" },
  ];

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
  const REACTION_STYLE_MAP: Record<
    ReactionType,
    {
      emoji: string;
      color: string;
      bg: string;
    }
  > = {
    like: {
      emoji: "👍",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    love: {
      emoji: "❤️",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    haha: {
      emoji: "😂",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    wow: {
      emoji: "😮",
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    sad: {
      emoji: "😢",
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
    },
    angry: {
      emoji: "😠",
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
  };
  const serverBookmark = bookmarkQuery.data;
  const saved = serverBookmark ? Boolean(serverBookmark.saved) : initialSaved;
  const rxCount = reactionsQuery.data
    ? reactionsQuery.data.counts.total
    : reactionCount;
  const reacted = Boolean(currentReaction);

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
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <div
                onMouseEnter={() => setPickerOpen(true)}
                className="relative"
              >
                <ActionButton
                  onClick={handleLikeClick}
                  active={reacted}
                  activeColor={
                    currentReaction
                      ? REACTION_STYLE_MAP[currentReaction].color
                      : "text-rose-500"
                  }
                  label={`${formatNumber(rxCount)} lượt thích`}
                  compact={isCompact}
                  className={cn(
                    likeAnim && "animate-bounce-once",
                    currentReaction &&
                    REACTION_STYLE_MAP[currentReaction].bg
                  )}
                >
                  {currentReaction ? (
                    <span
                      className={cn(
                        "transition-transform duration-200 scale-110",
                        isCompact ? "text-base" : "text-lg"
                      )}
                    >
                      {REACTION_STYLE_MAP[currentReaction].emoji}
                    </span>
                  ) : (
                    <Heart
                      className={cn(
                        "transition-all duration-200 text-[#8b8fa8]",
                        isCompact ? "w-4 h-4" : "w-5 h-5"
                      )}
                    />
                  )}

                  <span
                    className={cn(
                      "tabular-nums transition-colors",
                      isCompact ? "text-xs" : "text-sm",
                      currentReaction
                        ? REACTION_STYLE_MAP[currentReaction].color
                        : "text-[#8b8fa8]"
                    )}
                  >
                    {formatNumber(rxCount)}
                  </span>
                </ActionButton>
              </div>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={2}
              onMouseEnter={() => setPickerOpen(true)}
              onMouseLeave={() => setPickerOpen(false)}
            >
              <div className="flex items-center gap-1.5">
                {REACTION_OPTIONS.map((reaction) => (
                  <Button
                    key={reaction.type}
                    type="button"
                    variant={currentReaction === reaction.type ? "secondary" : "ghost"}
                    size="icon"
                    aria-label={reaction.label}
                    title={reaction.label}
                    onClick={() => void handleReactionSelect(reaction.type)}
                    className={cn(
                      "size-10 rounded-full text-lg transition-transform hover:scale-110",
                      currentReaction === reaction.type && "bg-accent"
                    )}
                  >
                    {reaction.emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

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
