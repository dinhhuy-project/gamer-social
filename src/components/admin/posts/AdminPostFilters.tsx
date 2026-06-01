"use client";

import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_POSTS_TEXT } from "@/components/admin/posts/admin-posts.constants";

import type { ListingStatus, PostStatus, PostType } from "@/types/api.types";

export type AdminPostFilterState = {
  search: string;
  postType: "all" | PostType;
  status: "all" | PostStatus;
  listingStatus: "all" | ListingStatus;
};

type AdminPostFiltersProps = {
  filters: AdminPostFilterState;
  onChange: (filters: AdminPostFilterState) => void;
  hidePostType?: boolean;
};

export function AdminPostFilters({ filters, onChange, hidePostType }: AdminPostFiltersProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-zinc-950/70 p-3 md:grid-cols-[minmax(240px,1fr)_auto_auto_auto]">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder={ADMIN_POSTS_TEXT.searchPlaceholder}
          className="h-9 border-white/10 bg-black/30 pl-9 text-zinc-100 placeholder:text-zinc-500"
        />
      </div>

      {!hidePostType ? (
        <Select
          value={filters.postType}
          onValueChange={(postType: "all" | PostType) => onChange({ ...filters, postType })}
        >
          <SelectTrigger className="h-9 w-full border-white/10 bg-black/30 text-zinc-100 md:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ADMIN_POSTS_TEXT.all}</SelectItem>
            <SelectItem value="regular">{ADMIN_POSTS_TEXT.regular}</SelectItem>
            <SelectItem value="marketplace">{ADMIN_POSTS_TEXT.marketplace}</SelectItem>
          </SelectContent>
        </Select>
      ) : null}

      <Select
        value={filters.status}
        onValueChange={(status: "all" | PostStatus) => onChange({ ...filters, status })}
      >
        <SelectTrigger className="h-9 w-full border-white/10 bg-black/30 text-zinc-100 md:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{ADMIN_POSTS_TEXT.all}</SelectItem>
          <SelectItem value="active">{ADMIN_POSTS_TEXT.active}</SelectItem>
          <SelectItem value="hidden">{ADMIN_POSTS_TEXT.hidden}</SelectItem>
          <SelectItem value="deleted">{ADMIN_POSTS_TEXT.deleted}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.listingStatus}
        onValueChange={(listingStatus: "all" | ListingStatus) => onChange({ ...filters, listingStatus })}
      >
        <SelectTrigger className="h-9 w-full border-white/10 bg-black/30 text-zinc-100 md:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{ADMIN_POSTS_TEXT.all}</SelectItem>
          <SelectItem value="pending_review">{ADMIN_POSTS_TEXT.pending_review}</SelectItem>
          <SelectItem value="approved">{ADMIN_POSTS_TEXT.approved}</SelectItem>
          <SelectItem value="rejected">{ADMIN_POSTS_TEXT.rejected}</SelectItem>
          <SelectItem value="sold">{ADMIN_POSTS_TEXT.sold}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
