"use client";

// src/components/post/PostForm.tsx
// Form tạo / sửa bài — hỗ trợ cả regular và marketplace

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Image as ImageIcon, X, Tag, DollarSign,
  Gamepad2, Loader2, Play,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { usePostMutations } from "@/hooks/posts/usePostMutations";
import { useUploadMedia } from "@/hooks/posts/useUploadMedia";
import { cn } from "@/lib/utils/cn";
import { CONFIG } from "@/lib/constants/config";
import type { PostTag } from "@/types/post.types";

type Tag = { id: number; name: string; slug: string };

type PostFormProps = {
  // Nếu có editPost → đang sửa bài
  editPost?: {
    id: string;
    content: string;
    postType: "regular" | "marketplace";
    mediaUrls: { url: string; type: "image" | "video" }[];
    postTags: PostTag[];
    listingPrice?: number | null;
    gameName?: string | null;
  };
  availableTags: Tag[];
  defaultPostType?: "regular" | "marketplace";
  onSuccess?: (postId: string) => void;
  onCancel?: () => void;
};

export function PostForm({
  editPost,
  availableTags,
  onSuccess,
  onCancel,
  defaultPostType,
}: PostFormProps) {
  const { profile } = useAuth();
  const isEdit = !!editPost;
  const { createMutation, updateMutation } = usePostMutations();

  const [content, setContent] = useState(editPost?.content ?? "");
  const [postType, setPostType] = useState<"regular" | "marketplace">(
    editPost?.postType ?? defaultPostType ?? "regular"
  );
  const [selectedTags, setSelectedTags] = useState<number[]>(
    editPost?.postTags.map(pt => pt.tag.id) ?? []
  );
  const [mediaFiles, setMediaFiles] = useState<{ url: string; file?: File; type: "image" | "video" }[]>(
    editPost?.mediaUrls ?? []
  );
  const [listingPrice, setListingPrice] = useState(editPost?.listingPrice?.toString() ?? "");
  const [gameName, setGameName] = useState(editPost?.gameName ?? "");
  const [showTags, setShowTags] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = content.trim().length > 0 || mediaFiles.length > 0;
  const isMember = profile?.role === "member" || profile?.role === "admin";
  const uploadMutation = useUploadMedia();

  // ── File picker ───────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (mediaFiles.length + files.length > CONFIG.MAX_IMAGES_PER_POST) {
      setError(`Tối đa ${CONFIG.MAX_IMAGES_PER_POST} ảnh/video`);
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFiles(prev => [
          ...prev,
          {
            url: reader.result as string,
            file,
            type: file.type.startsWith("video") ? "video" : "image",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [mediaFiles.length]);

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !profile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload media files lên Supabase Storage (nếu có file mới)
      const uploadedUrls = await Promise.all(
        mediaFiles.map(async (m) => {
          if (!m.file) return { url: m.url, type: m.type }; // existing
          const data = await uploadMutation.mutateAsync(m.file);
          return { url: data.url, type: m.type };
        })
      );

      // 2. Create or update post using usePostMutations (backend expects snake_case keys)
      const input: any = {
        content: content.trim() || undefined,
        media_urls: uploadedUrls.map((u: any) => u.url),
        post_type: postType,
        tag_ids: selectedTags,
      };

      if (postType === "marketplace") {
        input.listing_price = parseFloat(listingPrice || "0");
        input.game_name = gameName || undefined;
      }

      if (isEdit && editPost) {
        // update
        const updated = await updateMutation.mutateAsync({ id: editPost.id, input });
        onSuccess?.(updated.id);
      } else {
        const created = await createMutation.mutateAsync(input);
        onSuccess?.(created.id);
      }
    } catch (err: any) {
      setError(err.message ?? "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!profile) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-[#1e2128] rounded-2xl border border-[#2e3240]/60 overflow-hidden">
      {/* ── Post type switcher (members only). Hidden when defaultPostType === 'marketplace' ─────────────── */}
      {isMember && defaultPostType !== "marketplace" && (
        <div className="flex border-b border-[#2e3240]">
          {(["regular", "marketplace"] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setPostType(type)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                postType === type
                  ? "text-white border-b-2 border-[#f46d1b]"
                  : "text-[#8b8fa8] hover:text-white",
              )}
            >
              {type === "regular" ? "Bài đăng thường" : "🛒 Rao bán tài khoản"}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* ── Avatar + textarea ───────────────────────────── */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#f46d1b]/40 ring-offset-1 ring-offset-[#1e2128]">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="" width={36} height={36} className="object-cover" />
            ) : (
              <div className="w-full h-full bg-[#f46d1b]/20 flex items-center justify-center text-[#f46d1b] text-xs font-bold">
                {(profile.displayName ?? profile.username)[0].toUpperCase()}
              </div>
            )}
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === "marketplace"
                ? "Mô tả tài khoản bạn muốn bán..."
                : "Chia sẻ khoảnh khắc gaming của bạn..."
            }
            rows={3}
            maxLength={5000}
            className={cn(
              "flex-1 bg-transparent text-white text-sm leading-relaxed resize-none",
              "placeholder-[#8b8fa8]/50 focus:outline-none",
            )}
          />
        </div>

        {/* ── Marketplace fields ──────────────────────────── */}
        {postType === "marketplace" && (
          <div className="grid grid-cols-2 gap-2 bg-[#12131a] rounded-xl p-3 border border-[#2e3240]">
            <div className="space-y-1">
              <label className="text-[#8b8fa8] text-xs flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Giá bán (VND)
              </label>
              <input
                type="number"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                placeholder="0"
                min={0}
                required={postType === "marketplace"}
                className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-[#8b8fa8]/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8b8fa8] text-xs flex items-center gap-1">
                <Gamepad2 className="w-3 h-3" /> Tên game
              </label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Apex Legends, LMHT..."
                required={postType === "marketplace"}
                className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-[#8b8fa8]/40"
              />
            </div>
          </div>
        )}

        {/* ── Media previews ──────────────────────────────── */}
        {mediaFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {mediaFiles.map((m, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[#12131a]">
                {m.type === "video" ? (
                  <div className="w-full h-full">
                    <video
                      src={m.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      loop
                      autoPlay
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={m.url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center hover:bg-black transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Tag selector ────────────────────────────────── */}
        {showTags && (
          <div className="flex flex-wrap gap-1.5 p-2 bg-[#12131a] rounded-xl border border-[#2e3240]">
            {availableTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTags(prev =>
                  prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                )}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                  selectedTags.includes(tag.id)
                    ? "bg-[#f46d1b] text-white"
                    : "bg-[#2b2f3a] text-[#8b8fa8] hover:text-white",
                )}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* ── Toolbar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1 border-t border-[#2e3240]">
          <div className="flex items-center gap-1">
            {/* Media upload */}
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaFiles.length >= CONFIG.MAX_IMAGES_PER_POST}
              title="Thêm ảnh / video"
            >
              <ImageIcon className="w-4 h-4" />
            </ToolbarButton>

            {/* Tag toggle */}
            <ToolbarButton
              onClick={() => setShowTags(v => !v)}
              active={showTags || selectedTags.length > 0}
              title="Gắn tag"
            >
              <Tag className="w-4 h-4" />
              {selectedTags.length > 0 && (
                <span className="text-xs">{selectedTags.length}</span>
              )}
            </ToolbarButton>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Right: char count + buttons */}
          <div className="flex items-center gap-2">
            {content.length > 200 && (
              <span className={cn(
                "text-xs",
                content.length > 4800 ? "text-red-400" : "text-[#8b8fa8]",
              )}>
                {content.length}/5000
              </span>
            )}

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-1.5 rounded-lg text-sm text-[#8b8fa8] hover:text-white hover:bg-white/5 transition-colors"
              >
                Huỷ
              </button>
            )}

            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={cn(
                "px-5 py-1.5 rounded-lg text-sm font-semibold transition-all",
                "bg-[#f46d1b] hover:bg-[#e05c0a] text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center gap-1.5",
              )}
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? "Lưu thay đổi" : "Đăng bài"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function ToolbarButton({
  onClick, disabled, active, title, children,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex items-center gap-1 p-2 rounded-lg transition-colors text-sm",
        active
          ? "text-[#f46d1b] bg-[#f46d1b]/10"
          : "text-[#8b8fa8] hover:text-white hover:bg-white/5",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}
