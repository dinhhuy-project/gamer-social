"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostForm } from "./PostForm";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import useTags from "@/hooks/tags/useTags";
import type { TagDTO } from "@/types/api.types";

export function CreatePostModal({
  availableTags = [],
  onCreated,
  defaultPostType,
}: {
  availableTags?: TagDTO[];
  onCreated?: () => void;
  defaultPostType?: "regular" | "marketplace";
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { profile } = useAuth();
  const { data: tagsResponse } = useTags(1, 50);
  const resolvedTags = (availableTags && availableTags.length > 0) ? availableTags : tagsResponse?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full bg-[#1e2128] rounded-2xl border border-[#2e3240]/60 p-3 flex items-center gap-3 hover:border-[#3e4255]/80 transition-colors"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-[#1e2128] relative">
            {profile?.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName ?? profile.username}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#f46d1b]/40 flex items-center justify-center text-[#f46d1b] text-xs font-bold">
                {(profile?.displayName ??
                  profile?.username ??
                  "U")[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 text-left text-sm text-[#8b8fa8]">
            What&apos;s on your mind?
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tạo bài viết mới</DialogTitle>
        </DialogHeader>

        <div>
          <PostForm
            defaultPostType={defaultPostType}
            availableTags={resolvedTags}
            onSuccess={() => {
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["posts"] });
              onCreated?.();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreatePostModal;