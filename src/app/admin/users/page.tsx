"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon, UsersIcon } from "lucide-react";
import { toast } from "sonner";

import { UserDetailModal } from "@/components/admin/users/UserDetailModal";
import { UserFilters } from "@/components/admin/users/UserFilters";
import { UserTable } from "@/components/admin/users/UserTable";
import { ADMIN_USERS_TEXT } from "@/components/admin/users/admin-users.constants";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useAdminUser } from "@/hooks/useAdminUser";
import { useAdminUserMutations } from "@/hooks/useAdminUserMutations";
import { useAdminUsers } from "@/hooks/useAdminUsers";

import type { AdminUsersFilters } from "@/hooks/useAdminUsers";

const PAGE_SIZE = 20;

type AdminUsersUiFilters = Required<
  Pick<AdminUsersFilters, "search" | "role" | "isActive" | "verified">
>;

const initialFilters: AdminUsersUiFilters = {
  search: "",
  role: "all",
  isActive: "all",
  verified: "all",
};

export default function AdminUsersPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const queryFilters = useMemo<AdminUsersFilters>(
    () => ({
      search: debouncedSearch,
      role: filters.role,
      isActive: filters.isActive,
      verified: filters.verified,
      page,
      limit: PAGE_SIZE,
    }),
    [debouncedSearch, filters.isActive, filters.role, filters.verified, page]
  );

  const { data, isLoading, isFetching } = useAdminUsers(queryFilters);
  const { data: currentUser } = useCurrentUser();
  const { data: selectedUser, isLoading: isDetailLoading } = useAdminUser(selectedUserId);
  const mutations = useAdminUserMutations();

  const pagination = data?.pagination;

  const handleFiltersChange = (nextFilters: AdminUsersUiFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleUpdateStatus = (id: string, isActive: boolean) => {
    mutations.updateUserStatus.mutate(
      { id, isActive },
      {
        onSuccess: () => toast.success(ADMIN_USERS_TEXT.statusUpdated),
        onError: (error) => toast.error(error.message),
      }
    );
  };

  const handleUpdateRole = (id: string, role: "user" | "member") => {
    mutations.updateUserRole.mutate(
      { id, role },
      {
        onSuccess: () => toast.success(ADMIN_USERS_TEXT.roleUpdated),
        onError: (error) => toast.error(error.message),
      }
    );
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_30%),linear-gradient(180deg,#09090b,#18181b)] px-4 py-6 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100">
              <UsersIcon className="size-4" />
              {ADMIN_USERS_TEXT.pageTitle}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-normal text-white md:text-3xl">
              {ADMIN_USERS_TEXT.pageTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">{ADMIN_USERS_TEXT.pageDescription}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="border-cyan-400/20 bg-black/30 text-cyan-100 hover:bg-cyan-400/10">
              <Link href="/feed">
                <HomeIcon />
                {ADMIN_USERS_TEXT.backToHomePage}
              </Link>
            </Button>
            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300">
              {pagination?.total ?? 0} {ADMIN_USERS_TEXT.usersCountSuffix}
            </div>
          </div>
        </header>

        <UserFilters filters={filters} onChange={handleFiltersChange} />

        <UserTable
          users={data?.users ?? []}
          isLoading={isLoading}
          currentUserId={currentUser?.id}
          isMutating={mutations.isPending}
          onOpenUser={setSelectedUserId}
          onUpdateStatus={handleUpdateStatus}
          onUpdateRole={handleUpdateRole}
        />

        <footer className="flex flex-col gap-3 rounded-lg border border-white/10 bg-zinc-950/70 p-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {pagination?.page ?? page} / {pagination?.totalPages ?? 1}
            {isFetching ? ` - ${ADMIN_USERS_TEXT.loadingUsers}` : ""}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!pagination?.hasPreviousPage}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              disabled={!pagination?.hasNextPage}
              onClick={() => setPage((value) => value + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </footer>
      </div>

      <UserDetailModal
        open={Boolean(selectedUserId)}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(null);
        }}
        user={selectedUser}
        isLoading={isDetailLoading}
      />
    </main>
  );
}
