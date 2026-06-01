import { Badge } from "@/components/ui/badge";
import { ADMIN_POSTS_TEXT } from "@/components/admin/posts/admin-posts.constants";

import type { PostType } from "@/types/api.types";

export function PostTypeBadge({ type }: { type: PostType }) {
  return (
    <Badge
      variant="outline"
      className={
        type === "marketplace"
          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
          : "border-zinc-500/40 bg-zinc-500/10 text-zinc-200"
      }
    >
      {type === "marketplace" ? ADMIN_POSTS_TEXT.marketplace : ADMIN_POSTS_TEXT.regular}
    </Badge>
  );
}
