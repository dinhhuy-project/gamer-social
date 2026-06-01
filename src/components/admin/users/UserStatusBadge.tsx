import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ADMIN_USERS_TEXT } from "@/components/admin/users/admin-users.constants";

export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  const Icon = isActive ? CheckCircle2Icon : XCircleIcon;

  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-zinc-500/40 bg-zinc-500/10 text-zinc-300"
      }
    >
      <Icon className="size-3" />
      {isActive ? ADMIN_USERS_TEXT.active : ADMIN_USERS_TEXT.inactive}
    </Badge>
  );
}
