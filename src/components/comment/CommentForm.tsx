"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AvatarFallback } from "@/components/common/UserAvatar";
import { useAuth } from "@/providers/AuthProvider";
import { useCommentMutations } from "@/hooks/comments/useComments";
import { cn } from "@/lib/utils/cn";
import type { CommentDTO } from "@/types/api.types";
import { ROUTES } from "@/lib/constants/routes";
import Image from "next/image";

type CommentFormProps = {
  postId: string;
  parentId?: string | null;
  onSubmit?: (comment: CommentDTO) => void;
  initialValue?: string;
  placeholder?: string;
  compact?: boolean;
};

export function CommentForm({
  postId,
  parentId,
  onSubmit,
  initialValue = "",
  placeholder = "Viết bình luận...",
  compact = false,
}: CommentFormProps) {
  const { profile } = useAuth();
  const { createMutation } = useCommentMutations();

  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!profile) return;
    const content = value.trim();
    if (!content) return;

    try {
      setSubmitting(true);
      const created = await createMutation.mutateAsync({ postId, input: { content, parentId: parentId ?? undefined } });
      setValue("");
      onSubmit?.(created);
    } catch {
      // swallow - hooks already handle optimistic updates / errors
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn("flex gap-3 items-start", compact ? "text-sm" : "")}>
      {/* Avatar */}
      <Link
        href={ROUTES.profile(profile?.username.toString() ?? "")}
        className="flex-shrink-0 relative"
      >
        <div className={cn(
          "w-10 h-10 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-[#1e2128]",
          profile?.role === "admin" && "ring-red-500",
          profile?.role === "member" && "ring-[#f46d1b]",
          profile?.role === "user" && "ring-transparent",
        )}>
          {profile?.avatarUrl ? (
            <Image
              src={profile?.avatarUrl}
              alt={profile?.displayName ?? profile?.username}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            <AvatarFallback name={profile?.displayName?.toString() ?? ""} />
          )}
        </div>
      </Link>

      <form className="flex-1" onSubmit={handleSubmit}>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="comment-input"
        />

        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-muted-foreground">{value.length}/1000</div>

          <div className="flex gap-2">
            {!profile ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/login">Đăng nhập</Link>
              </Button>
            ) : (
              <Button type="submit" size="sm" disabled={!value.trim() || isSubmitting}>
                {isSubmitting ? "Đang gửi..." : parentId ? "Trả lời" : "Bình luận"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default CommentForm;
