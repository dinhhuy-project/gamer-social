// src/components/reaction/ReactionButton.tsx
"use client";

import { Heart } from "lucide-react";
import { REACTION_STYLE_MAP } from "./reactionConstants";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import type { ReactionType } from "@/types/api.types";

type ReactionButtonProps = {
  currentReaction: ReactionType | null;
  count: number;
  isAnimating?: boolean;
  onClick?: () => void;
  compact?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function ReactionButton({
  currentReaction,
  count,
  isAnimating = false,
  onClick,
  compact = false,
  onMouseEnter,
  onMouseLeave,
}: ReactionButtonProps) {
  const reacted = Boolean(currentReaction);
  const activeColor = currentReaction
    ? REACTION_STYLE_MAP[currentReaction].color
    : "text-rose-500";
  const bgColor = currentReaction
    ? REACTION_STYLE_MAP[currentReaction].bg
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={`${formatNumber(count)} lượt thích`}
      aria-pressed={reacted}
      className={cn(
        "flex items-center gap-1.5 rounded-lg transition-all duration-150",
        "hover:bg-white/5 active:scale-95",
        compact ? "px-2 py-1.5" : "px-3 py-2",
        reacted && activeColor,
        bgColor,
        isAnimating && "animate-bounce-once"
      )}
    >
      {currentReaction ? (
        <span
          className={cn(
            "transition-transform duration-200 scale-110",
            compact ? "text-base" : "text-lg"
          )}
        >
          {REACTION_STYLE_MAP[currentReaction].emoji}
        </span>
      ) : (
        <Heart
          className={cn(
            "transition-all duration-200 text-[#8b8fa8]",
            compact ? "w-4 h-4" : "w-5 h-5"
          )}
        />
      )}

      <span
        className={cn(
          "tabular-nums transition-colors",
          compact ? "text-xs" : "text-sm",
          reacted
            ? REACTION_STYLE_MAP[currentReaction!].color
            : "text-[#8b8fa8]"
        )}
      >
        {formatNumber(count)}
      </span>
    </button>
  );
}
