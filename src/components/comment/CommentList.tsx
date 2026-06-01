"use client";

import React, { useMemo, useState } from "react";
import { CommentItem } from "./CommentItem";
import { useComments } from "@/hooks/comments/useComments";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils/cn";
import type { CommentDTO } from "@/types/api.types";
import { Button } from "@/components/ui/button";

type CommentListProps = {
  postId: string;
  comments?: CommentDTO[];
  perPage?: number;
  repliesPerRoot?: number;
  initialPage?: number;
};

export function CommentList({
  postId,
  comments = [],
  perPage = 10,
  repliesPerRoot = 2,
  initialPage = 1,
}: CommentListProps) {
  const [page, setPage] = useState(initialPage);

  const query = useComments(
    postId,
    page,
    perPage,
    repliesPerRoot
  );

  const items = useMemo(() => {
    if (page === 1) {
      return query.data?.data ?? comments;
    }

    return query.data?.data ?? [];
  }, [query.data, comments, page]);

  if (query.isLoading && items.length === 0) {
    return (
      <div className={cn("flex flex-col gap-2")}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3"
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-4 w-40" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty>
        <EmptyTitle>
          Chưa có bình luận
        </EmptyTitle>

        <EmptyDescription>
          Hãy là người đầu tiên bình luận về bài
          viết này.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          postId={postId}
        />
      ))}

      <div className="mt-3 flex justify-center">
        {query.data?.hasMore ? (
          <Button
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={query.isFetching}
          >
            {query.isFetching
              ? "Đang tải..."
              : "Xem thêm bình luận"}
          </Button>
        ) : (
          <div className="text-xs text-muted-foreground">
            Không còn bình luận
          </div>
        )}
      </div>
    </div>
  );
}