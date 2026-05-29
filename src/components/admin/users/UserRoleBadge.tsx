import { ShieldCheckIcon, StarIcon, UserIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ADMIN_USERS_TEXT } from "@/components/admin/users/admin-users.constants";

import type { UserRole } from "@/types/api.types";

const roleMeta = {
  user: {
    label: ADMIN_USERS_TEXT.user,
    className: "border-slate-500/30 bg-slate-500/10 text-slate-200",
    Icon: UserIcon,
  },
  member: {
    label: ADMIN_USERS_TEXT.member,
    className: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
    Icon: StarIcon,
  },
  admin: {
    label: ADMIN_USERS_TEXT.admin,
    className: "border-rose-400/30 bg-rose-400/10 text-rose-200",
    Icon: ShieldCheckIcon,
  },
} satisfies Record<UserRole, { label: string; className: string; Icon: typeof UserIcon }>;

export function UserRoleBadge({ role }: { role: UserRole }) {
  const meta = roleMeta[role];

  return (
    <Badge variant="outline" className={meta.className}>
      <meta.Icon className="size-3" />
      {meta.label}
    </Badge>
  );
}
