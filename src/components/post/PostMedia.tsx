"use client";

// src/components/post/PostMedia.tsx
// Hiển thị ảnh / video trong bài đăng
// Hỗ trợ: 1 ảnh full-width, 2 ảnh side-by-side, 3-4 ảnh dạng grid

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { PostMedia as PostMediaType } from "@/types/post.types";

type PostMediaProps = {
  mediaUrls: Array<PostMediaType | string>;
  postId: string;
};

function normalizeMedia(media: PostMediaType | string): PostMediaType {
  if (typeof media === "string") {
    const url = media;
    const isDataVideo = /^data:video\//i.test(url);
    const videoExtRe = /\.(mp4|webm|ogg|mov|m4v|avi|flv|wmv|mkv)(\?.*)?$/i;
    const isVideo = isDataVideo || videoExtRe.test(url);
    return { url, type: isVideo ? "video" : "image" };
  }

  return media;
}

export function PostMedia({ mediaUrls, postId }: PostMediaProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!mediaUrls || mediaUrls.length === 0) return null;

  const count = mediaUrls.length;

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex(i => (i! - 1 + count) % count);
  const next = () => setLightboxIndex(i => (i! + 1) % count);

  return (
    <>
      {/* ── Grid layout ─────────────────────────────────── */}
      <div className={cn(
        "mt-3 rounded-xl overflow-hidden",
        count === 1 && "aspect-[16/9]",
        count === 2 && "grid grid-cols-2 gap-0.5",
        count === 3 && "grid grid-cols-2 gap-0.5",
        count >= 4 && "grid grid-cols-2 gap-0.5",
      )}>
        {mediaUrls.slice(0, 4).map((media, i) => {
          const normalized = normalizeMedia(media);
          const isThreeFirst = count === 3 && i === 0;
          const isHidden = i === 3 && count > 4;
          const remaining = count - 4;

          return (
            <div
              key={`${postId}-media-${i}`}
              className={cn(
                "relative overflow-hidden cursor-pointer group",
                count === 1 && "w-full h-full",
                count === 2 && "aspect-square",
                isThreeFirst && "row-span-2 aspect-auto",
                count === 3 && i > 0 && "aspect-square",
                count >= 4 && "aspect-square",
              )}
              onClick={() => openLightbox(i)}
            >
              {normalized.type === "video" ? (
                <VideoThumbnail src={normalized.url} />
              ) : (
                <Image
                  src={normalized.url}
                  alt={`Media ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              )}

              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

              {/* "Còn X ảnh" overlay */}
              {isHidden && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{remaining}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Lightbox ─────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Counter */}
          {count > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {lightboxIndex + 1} / {count}
            </div>
          )}

          {/* Prev */}
          {count > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const media = normalizeMedia(mediaUrls[lightboxIndex]);
              return media.type === "video" ? (
                <video
                  src={media.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-[90vw] max-h-[90vh] rounded-lg"
                />
              ) : (
                <Image
                  src={media.url}
                  alt={`Media ${lightboxIndex + 1}`}
                  width={1200}
                  height={800}
                  className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                />
              );
            })()}
          </div>

          {/* Next */}
          {count > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ── Video thumbnail ──────────────────────────────────────────
function VideoThumbnail({ src }: { src: string }) {
  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video
        src={src}
        className="w-full h-full object-cover"
        muted
        playsInline
        preload="metadata"
        loop
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>
    </div>
  );
}
