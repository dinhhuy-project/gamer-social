"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ADMIN_POSTS_TEXT } from "@/components/admin/posts/admin-posts.constants";

type ListingReviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (reason: string) => void;
  isPending?: boolean;
};

export function ListingReviewModal({ open, onOpenChange, onReject, isPending }: ListingReviewModalProps) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setReason("");
      }}
    >
      <DialogContent className="border border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{ADMIN_POSTS_TEXT.confirmReject}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={ADMIN_POSTS_TEXT.rejectReasonPlaceholder}
          className="min-h-28 border-white/10 bg-black/30 text-zinc-100"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {ADMIN_POSTS_TEXT.cancel}
          </Button>
          <Button
            variant="destructive"
            disabled={isPending || !reason.trim()}
            onClick={() => {
              onReject(reason.trim());
              setReason("");
            }}
          >
            {ADMIN_POSTS_TEXT.confirmReject}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
