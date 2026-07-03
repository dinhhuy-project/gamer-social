// src/components/post/PostTagList.tsx
// Danh sách tags gắn vào bài đăng

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { PostTag } from "@/types/post.types";

type PostTagListProps = {
  tags: PostTag[];
  variant?: "inline" | "pill";  // inline = gọn trong header, pill = badge riêng
  className?: string;
};

export function PostTagList({ tags, variant = "inline", className }: PostTagListProps) {
  if (!tags || tags.length === 0) return null;

  if (variant === "inline") {
    // Dùng trong header bài đăng: "Posted in Apex Legends"
    return (
      <span className={cn("text-[#8b8fa8] text-sm", className)}>
        Posted in{" "}
        {tags.slice(0, 2).map((pt, i) => (
          <span key={pt.tag.id} className="text-[#f46d1b] hover:underline hover:text-[#ff8533] transition-colors">
            {pt.tag.name}
            {i < Math.min(tags.length, 2) - 1 && ", "}
          </span>
        ))}
        {tags.length > 2 && (
          <span className="text-[#8b8fa8]"> +{tags.length - 2}</span>
        )}
      </span>
    );
  }

  // pill variant — hiển thị badge riêng biệt
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((pt) => (
        <span
          key={pt.tag.id}
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            "bg-[#f46d1b]/10 text-[#f46d1b] border border-[#f46d1b]/20",
            "hover:bg-[#f46d1b]/20 transition-colors",
          )}
        >
          #{pt.tag.name}
        </span>
      ))}
    </div>
  );
}
