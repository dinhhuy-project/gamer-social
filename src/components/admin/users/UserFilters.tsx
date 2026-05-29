"use client";

import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADMIN_USERS_TEXT } from "@/components/admin/users/admin-users.constants";

import type { AdminUsersFilters } from "@/hooks/useAdminUsers";
import type { UserRole } from "@/types/api.types";

type UserFiltersProps = {
  filters: Required<Pick<AdminUsersFilters, "search" | "role" | "isActive" | "verified">>;
  onChange: (filters: UserFiltersProps["filters"]) => void;
};

export function UserFilters({ filters, onChange }: UserFiltersProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-zinc-950/70 p-3 md:grid-cols-[minmax(240px,1fr)_auto_auto_auto]">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder={ADMIN_USERS_TEXT.searchPlaceholder}
          className="h-9 border-white/10 bg-black/30 pl-9 text-zinc-100 placeholder:text-zinc-500"
        />
      </div>

      <Select
        value={filters.role}
        onValueChange={(role: "all" | UserRole) => onChange({ ...filters, role })}
      >
        <SelectTrigger className="h-9 w-full border-white/10 bg-black/30 text-zinc-100 md:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{ADMIN_USERS_TEXT.allRoles}</SelectItem>
          <SelectItem value="user">{ADMIN_USERS_TEXT.user}</SelectItem>
          <SelectItem value="member">{ADMIN_USERS_TEXT.member}</SelectItem>
          <SelectItem value="admin">{ADMIN_USERS_TEXT.admin}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.isActive}
        onValueChange={(isActive: "all" | "active" | "inactive") =>
          onChange({ ...filters, isActive })
        }
      >
        <SelectTrigger className="h-9 w-full border-white/10 bg-black/30 text-zinc-100 md:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{ADMIN_USERS_TEXT.allStatuses}</SelectItem>
          <SelectItem value="active">{ADMIN_USERS_TEXT.active}</SelectItem>
          <SelectItem value="inactive">{ADMIN_USERS_TEXT.inactive}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.verified}
        onValueChange={(verified: "all" | "verified" | "unverified") =>
          onChange({ ...filters, verified })
        }
      >
        <SelectTrigger className="h-9 w-full border-white/10 bg-black/30 text-zinc-100 md:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{ADMIN_USERS_TEXT.allVerification}</SelectItem>
          <SelectItem value="verified">{ADMIN_USERS_TEXT.emailVerified}</SelectItem>
          <SelectItem value="unverified">{ADMIN_USERS_TEXT.emailUnverified}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
