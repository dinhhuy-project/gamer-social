"use client";

import { useState } from "react";
import { BanIcon, CheckIcon, EyeIcon, MailCheckIcon, MailXIcon, RotateCcwIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_USERS_TEXT } from "@/components/admin/users/admin-users.constants";
import { UserRoleBadge } from "@/components/admin/users/UserRoleBadge";
import { UserStatusBadge } from "@/components/admin/users/UserStatusBadge";
import { formatDateTime, formatNumber } from "@/lib/utils/format";

import type { AdminUserListItem } from "@/types/api.types";

type UserTableProps = {
  users: AdminUserListItem[];
  isLoading: boolean;
  currentUserId?: string | null;
  onOpenUser: (id: string) => void;
  onUpdateStatus: (id: string, isActive: boolean) => void;
  onUpdateRole: (id: string, role: "user" | "member") => void;
  isMutating?: boolean;
};

function initials(value: string) {
  return value.slice(0, 2).toUpperCase();
}

function dateOrNever(value: string | null) {
  return value ? formatDateTime(value) : ADMIN_USERS_TEXT.never;
}

function UserTableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <TableRow key={index} className="border-white/10">
          <TableCell><Skeleton className="size-9 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-44" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-10" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function UserTable({
  users,
  isLoading,
  currentUserId,
  onOpenUser,
  onUpdateStatus,
  onUpdateRole,
  isMutating,
}: UserTableProps) {
  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(null);
  const pendingUser = users.find((user) => user.id === pendingDeactivateId);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950/80 shadow-2xl shadow-cyan-950/10">
      <Table>
        <TableHeader className="bg-white/[0.03]">
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead>{ADMIN_USERS_TEXT.avatar}</TableHead>
            <TableHead>{ADMIN_USERS_TEXT.username}</TableHead>
            <TableHead>{ADMIN_USERS_TEXT.displayName}</TableHead>
            <TableHead>{ADMIN_USERS_TEXT.email}</TableHead>
            <TableHead>{ADMIN_USERS_TEXT.role}</TableHead>
            <TableHead>{ADMIN_USERS_TEXT.status}</TableHead>
            <TableHead>{ADMIN_USERS_TEXT.verified}</TableHead>
            <TableHead className="text-right">{ADMIN_USERS_TEXT.posts}</TableHead>
            <TableHead>{ADMIN_USERS_TEXT.createdAt}</TableHead>
            <TableHead>{ADMIN_USERS_TEXT.lastSeenAt}</TableHead>
            <TableHead className="text-right">{ADMIN_USERS_TEXT.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <UserTableSkeleton />
          ) : users.length === 0 ? (
            <TableRow className="border-white/10">
              <TableCell colSpan={11} className="h-36 text-center">
                <div className="mx-auto grid max-w-sm gap-1 text-zinc-400">
                  <p className="font-medium text-zinc-200">{ADMIN_USERS_TEXT.noUsers}</p>
                  <p className="text-sm">{ADMIN_USERS_TEXT.noUsersDescription}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const canChangeRole = user.role !== "admin";
              const canDeactivate = user.id !== currentUserId;

              return (
                <TableRow
                  key={user.id}
                  className="cursor-pointer border-white/10 text-zinc-200 hover:bg-cyan-500/5"
                  onClick={() => onOpenUser(user.id)}
                >
                  <TableCell>
                    <Avatar className="ring-1 ring-cyan-400/20">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.username} />
                      <AvatarFallback>{initials(user.username)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium text-white">@{user.username}</TableCell>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell className="text-zinc-300">{user.email}</TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    {canChangeRole ? (
                      <Select
                        value={user.role}
                        disabled={isMutating}
                        onValueChange={(role: "user" | "member") => onUpdateRole(user.id, role)}
                      >
                        <SelectTrigger className="h-8 w-28 border-white/10 bg-black/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">{ADMIN_USERS_TEXT.user}</SelectItem>
                          <SelectItem value="member">{ADMIN_USERS_TEXT.member}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <UserRoleBadge role={user.role} />
                    )}
                  </TableCell>
                  <TableCell><UserStatusBadge isActive={user.isActive} /></TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      {user.emailVerified ? (
                        <MailCheckIcon className="size-4 text-emerald-300" />
                      ) : (
                        <MailXIcon className="size-4 text-zinc-500" />
                      )}
                      {user.emailVerified ? ADMIN_USERS_TEXT.emailVerified : ADMIN_USERS_TEXT.emailUnverified}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(user.postsCount)}</TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell>{dateOrNever(user.lastSeenAt)}</TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onOpenUser(user.id)}
                        aria-label={ADMIN_USERS_TEXT.viewDetails}
                      >
                        <EyeIcon />
                      </Button>
                      {user.isActive ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          disabled={!canDeactivate || isMutating}
                          title={!canDeactivate ? ADMIN_USERS_TEXT.selfDeactivateBlocked : undefined}
                          onClick={() => setPendingDeactivateId(user.id)}
                          aria-label={ADMIN_USERS_TEXT.deactivate}
                        >
                          <BanIcon />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={isMutating}
                          onClick={() => onUpdateStatus(user.id, true)}
                          aria-label={ADMIN_USERS_TEXT.reactivate}
                        >
                          <RotateCcwIcon />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <AlertDialog open={Boolean(pendingDeactivateId)} onOpenChange={(open) => !open && setPendingDeactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ADMIN_USERS_TEXT.confirmDeactivateTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {ADMIN_USERS_TEXT.confirmDeactivateDescription}
              {pendingUser ? ` @${pendingUser.username}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ADMIN_USERS_TEXT.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDeactivateId) onUpdateStatus(pendingDeactivateId, false);
                setPendingDeactivateId(null);
              }}
            >
              <CheckIcon />
              {ADMIN_USERS_TEXT.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
