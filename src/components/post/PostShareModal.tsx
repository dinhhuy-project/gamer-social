"use client";

// src/components/post/PostShareModal.tsx
// Modal chia sẻ bài đăng: copy link, share lên tường

import { useState } from "react";
import { Check, Copy, X, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { ROUTES } from "@/lib/constants/routes";
import { usePostMutations } from "@/hooks/posts/usePostMutations";

type PostShareModalProps = {
  open: boolean;
  onClose: () => void;
  postId: string;
};

export function PostShareModal({ open, onClose, postId }: PostShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const { create } = usePostMutations();

  const postUrl = typeof window !== "undefined"
    ? `${window.location.origin}${ROUTES.post(postId)}`
    : "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = postUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      // Create a new post that references the original post via content.
      // The backend expects `content`, `media_urls`, `post_type`, `tag_ids` per schema.
      // We'll create a simple share post with content containing the note and original post URL.
      const url = typeof window !== "undefined" ? `${window.location.origin}${ROUTES.post(postId)}` : ROUTES.post(postId);

      const input = {
        content: `${shareNote ? shareNote + "\n\n" : ""}${url}`,
        media_urls: [],
        post_type: "regular",
        tag_ids: [],
      };

      create(input);
      onClose();
    } finally {
      setSharing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1e2128] border-[#2e3240] text-white max-w-md p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[#2e3240]">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white font-semibold text-base">
              Chia sẻ bài viết
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-[#8b8fa8] hover:text-white transition-colors p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {/* Copy link */}
          <div className="space-y-1.5">
            <p className="text-[#8b8fa8] text-xs font-medium uppercase tracking-wide">
              Link bài viết
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#12131a] border border-[#2e3240] rounded-lg px-3 py-2.5 flex items-center gap-2 min-w-0">
                <Globe className="w-3.5 h-3.5 text-[#8b8fa8] flex-shrink-0" />
                <span className="text-[#8b8fa8] text-sm truncate">{postUrl}</span>
              </div>
              <button
                onClick={handleCopy}
                className={cn(
                  "flex-shrink-0 px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all",
                  copied
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-[#2b2f3a] text-white hover:bg-[#363b47] border border-[#2e3240]",
                )}
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5" /> Đã copy</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy</>
                )}
              </button>
            </div>
          </div>

          {/* Share to feed */}
          <div className="space-y-1.5">
            <p className="text-[#8b8fa8] text-xs font-medium uppercase tracking-wide">
              Đăng lên tường của bạn
            </p>
            <textarea
              value={shareNote}
              onChange={(e) => setShareNote(e.target.value)}
              placeholder="Thêm ghi chú... (không bắt buộc)"
              rows={2}
              maxLength={280}
              className={cn(
                "w-full bg-[#12131a] border border-[#2e3240] rounded-lg px-3 py-2.5",
                "text-white text-sm placeholder-[#8b8fa8]/50 resize-none",
                "focus:outline-none focus:border-[#f46d1b]/50 focus:ring-1 focus:ring-[#f46d1b]/20",
                "transition-colors",
              )}
            />
            {shareNote.length > 0 && (
              <p className="text-[#8b8fa8] text-xs text-right">{shareNote.length}/280</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#2e3240] text-[#8b8fa8] hover:text-white hover:border-[#3e4255] text-sm font-medium transition-colors"
            >
              Huỷ
            </button>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex-1 py-2.5 rounded-lg bg-[#f46d1b] hover:bg-[#e05c0a] disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {sharing ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang chia sẻ...</>
              ) : "Chia sẻ"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
