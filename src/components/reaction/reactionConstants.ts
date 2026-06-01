// src/components/reaction/reactionConstants.ts
import type { ReactionType } from "@/types/api.types";

export const REACTION_OPTIONS: Array<{
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

export const REACTION_STYLE_MAP: Record<
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
