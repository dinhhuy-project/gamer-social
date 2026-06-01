import { Badge } from "@/components/ui/badge";
import { ADMIN_POSTS_TEXT } from "@/components/admin/posts/admin-posts.constants";

import type { ListingStatus } from "@/types/api.types";

const classes = {
  pending_review: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  rejected: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  sold: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
} satisfies Record<ListingStatus, string>;

export function ListingStatusBadge({ status }: { status: ListingStatus | null }) {
  if (!status) {
    return <span className="text-zinc-500">-</span>;
  }

  return (
    <Badge variant="outline" className={classes[status]}>
      {ADMIN_POSTS_TEXT[status]}
    </Badge>
  );
}
