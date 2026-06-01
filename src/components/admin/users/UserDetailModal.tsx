"use client";

import { CalendarIcon, MailIcon, RadioIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_USERS_TEXT } from "@/components/admin/users/admin-users.constants";
import { UserRoleBadge } from "@/components/admin/users/UserRoleBadge";
import { UserStatusBadge } from "@/components/admin/users/UserStatusBadge";
import { formatDateTime, formatNumber } from "@/lib/utils/format";

import type { AdminUserDetail } from "@/types/api.types";

type UserDetailModalProps = {
  user: AdminUserDetail | undefined;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function initials(value: string) {
  return value.slice(0, 2).toUpperCase();
}

function DetailStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-white">{formatNumber(value)}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-28 rounded-lg" />
      <div className="flex gap-3">
        <Skeleton className="size-16 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-20 rounded-lg" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}

export function UserDetailModal({ user, isLoading, open, onOpenChange }: UserDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ADMIN_USERS_TEXT.userDetails}</DialogTitle>
          <DialogDescription>{ADMIN_USERS_TEXT.profile}</DialogDescription>
        </DialogHeader>

        {isLoading || !user ? (
          <DetailSkeleton />
        ) : (
          <div className="grid gap-4">
            <div className="relative h-32 overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.35),transparent_28%),linear-gradient(135deg,#09090b,#18181b_45%,#04111d)]">
              {user.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.coverUrl} alt="" className="size-full object-cover" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
            </div>

            <div className="-mt-10 flex flex-col gap-3 px-3 sm:flex-row sm:items-end">
              <Avatar className="size-20 border-4 border-zinc-950 ring-1 ring-cyan-400/30">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.username} />
                <AvatarFallback>{initials(user.username)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold text-white">@{user.username}</h2>
                  <UserRoleBadge role={user.role} />
                  <UserStatusBadge isActive={user.isActive} />
                </div>
                <p className="mt-1 truncate text-sm text-zinc-400">{user.displayName}</p>
              </div>
            </div>

            <div className="grid gap-2 rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
              <div className="flex items-center gap-2">
                <MailIcon className="size-4 text-cyan-300" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-cyan-300" />
                <span>{formatDateTime(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <RadioIcon className="size-4 text-cyan-300" />
                <span>{user.lastSeenAt ? formatDateTime(user.lastSeenAt) : ADMIN_USERS_TEXT.never}</span>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <div className="text-xs uppercase tracking-wider text-zinc-500">{ADMIN_USERS_TEXT.bio}</div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{user.bio || ADMIN_USERS_TEXT.noBio}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <DetailStat label={ADMIN_USERS_TEXT.posts} value={user.postsCount} />
              <DetailStat label={ADMIN_USERS_TEXT.followers} value={user.followersCount} />
              <DetailStat label={ADMIN_USERS_TEXT.following} value={user.followingCount} />
              <DetailStat label={ADMIN_USERS_TEXT.marketplaceListings} value={user.marketplaceListingsCount} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
