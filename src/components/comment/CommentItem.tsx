"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { AvatarFallback } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { formatTimeAgo } from "@/lib/utils/format";
import type { CommentDTO, ReactionType } from "@/types/api.types";
import { useAuth } from "@/providers/AuthProvider";
import { CommentForm } from "./CommentForm";
import { ReactionButton, ReactionPicker } from "@/components/reaction";
import { Skeleton } from "@/components/ui/skeleton";
import { useComment } from "@/hooks/comments/useComments";
import { useCommentReactions } from "@/hooks/comments/useCommentReactions";
import { useCommentReactionMutations } from "@/hooks/comments/useCommentReactionMutations";
import { useCommentMutations } from "@/hooks/comments/useComments";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants/routes";
import Image from "next/image";

type CommentItemProps = {
  comment: CommentDTO;
  postId: string;
  depth?: number;
};

export function CommentItem({ comment, postId, depth = 0 }: CommentItemProps) {
  const { profile } = useAuth();
  const isOwner = profile?.id === comment.userId;

  const [showReply, setShowReply] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reactionsQuery = useCommentReactions(comment.id);
  const { reactMutation, removeMutation } = useCommentReactionMutations();
  const { deleteMutation, updateMutation } = useCommentMutations();

  const commentQuery = useComment(comment.id, comment);
  const data = commentQuery.data ?? comment;
  const isRefetching = commentQuery.isFetching;

  const currentReaction = reactionsQuery.data?.viewerReaction ?? null;
  const rxCount = reactionsQuery.data?.counts.total ?? 0;

  const [editValue, setEditValue] = useState(comment.content ?? "");
  const [updating, setUpdating] = useState(false);

  const handleReactionSelect = useCallback(
    async (type: ReactionType) => {
      if (!profile) return;
      try {
        if (currentReaction === type) {
          await removeMutation.mutateAsync(comment.id);
        } else {
          await reactMutation.mutateAsync({ commentId: comment.id, type });
        }
      } catch {
        // noop - hooks handle rollback
      } finally {
        setPickerOpen(false);
      }
    },
    [currentReaction, comment.id, profile, reactMutation, removeMutation, setPickerOpen]
  );

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync({ commentId: comment.id, postId });
      toast.success("Đã xóa bình luận");
    } catch {
      toast.error("Xóa bình luận thất bại");
    } finally {
      setDeleting(false);
    }
  }

  async function handleUpdate(e?: React.FormEvent) {
    e?.preventDefault();
    const content = editValue.trim();
    if (!content) return;

    setUpdating(true);
    try {
      await updateMutation.mutateAsync({ commentId: comment.id, input: { content } });
      toast.success("Đã cập nhật bình luận");
      setEditing(false);
    } catch {
      toast.error("Cập nhật bình luận thất bại");
    } finally {
      setUpdating(false);
    }
  }

  function handleCancelEdit() {
    setEditValue(data.content ?? "");
    setEditing(false);
  }

  return (
    <div className={cn("flex gap-3 py-3", depth > 0 && "pl-6")}>
      <div className="flex-shrink-0">
        {/* Avatar */}
        {isRefetching ? (
          <Skeleton className="h-10 w-10 rounded-full" />
        ) : (
          <Link
            href={ROUTES.profile(data.author?.username.toString() ?? "")}
            className="flex-shrink-0 relative"
          >
            <div className={cn(
              "w-10 h-10 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-[#1e2128]",
              data.author?.role === "admin" && "ring-red-500",
              data.author?.role === "member" && "ring-[#f46d1b]",
              data.author?.role === "user" && "ring-transparent",
            )}>
              {data.author?.avatarUrl ? (
                <Image
                  src={data.author?.avatarUrl}
                  alt={data.author?.displayName ?? data.author?.username}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <AvatarFallback name={data.author?.displayName?.toString() ?? ""} />
              )}
            </div>
          </Link>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {isRefetching ? (
              <>
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>

                <div className="mt-1">
                  <Skeleton className="h-3 w-full" />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <Link href={`/profile/${data.author?.username ?? ""}`} className="font-medium hover:underline">
                    {data.author?.displayName ?? data.author?.username ?? "Người dùng"}
                  </Link>

                  <span className="text-xs text-muted-foreground">{formatTimeAgo(data.createdAt)}</span>
                </div>

                <div className="mt-1 text-sm">
                  {editing ? (
                    <form onSubmit={handleUpdate}>
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Chỉnh sửa bình luận..."
                        aria-label="edit-comment"
                      />

                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-muted-foreground">{editValue.length}/1000</div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={updating}>
                            Hủy
                          </Button>

                          <Button type="submit" size="sm" disabled={!editValue.trim() || updating}>
                            {updating ? "Đang lưu..." : "Lưu"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div>{data.content}</div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-start gap-2">
            {isRefetching ? (
              <Skeleton className="h-4 w-10" />
            ) : (
              isOwner && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditValue(data.content ?? "");
                      setEditing((s) => !s);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xóa bình luận</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xóa bình luận này? Hành động sẽ không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          {isRefetching ? (
            <>
              <Skeleton className="h-4 w-12 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </>
          ) : (
            <>
              <ReactionPicker
                currentReaction={currentReaction}
                onSelect={handleReactionSelect}
                open={pickerOpen}
                onOpenChange={setPickerOpen}
              >
                <div onMouseEnter={() => setPickerOpen(true)} className="relative">
                  <ReactionButton
                    currentReaction={currentReaction}
                    count={rxCount}
                    compact={true}
                    onClick={() => handleReactionSelect("like")}
                  />
                </div>
              </ReactionPicker>

              <Button variant="ghost" size="sm" onClick={() => setShowReply((s) => !s)}>
                <MessageSquare className="w-4 h-4" />
                <span className="ml-1 text-sm">Trả lời</span>
              </Button>
            </>
          )}
        </div>

        {showReply && (
          <div className="mt-3">
            <CommentForm postId={postId} parentId={comment.id} onSubmit={() => setShowReply(false)} compact={true} />
          </div>
        )}

        {data.children && data.children.length > 0 && (
          <div className="mt-3">
            {data.children.map((c) => (
              <CommentItem key={c.id} comment={c} postId={postId} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentItem;
