"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  User,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";

import {
  Button,
} from "@/components/ui/button";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import Image from "next/image";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useUnreadNotifications } from "@/hooks/notifications/useUnreadNotifications";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { useMarkNotificationRead } from "@/hooks/notifications/useMarkNotificationRead";
import { useMarkAllNotificationsRead } from "@/hooks/notifications/useMarkAllNotificationsRead";
import { useGlobalSearch } from "@/hooks/search/useGlobalSearch";
import { ROUTES } from "@/lib/constants/routes";

export function SiteHeader() {
  const { signOut, isLoading } = useAuthActions();
  const { data: currentUser } = useCurrentUser();
  const { data: unread } = useUnreadNotifications(currentUser?.id);
  // Notification subscription now handled by NotificationProvider
  const notificationsQuery = useNotifications(currentUser?.id);
  const unreadList = (notificationsQuery.data?.data ?? []).filter((it: any) => !it.isRead);
  const router = useRouter();
  const messageUnreadList = (notificationsQuery.data?.data ?? []).filter((it: any) => it.type === "new_message" && !it.isRead);
  const { markNotificationRead } = useMarkNotificationRead(currentUser?.id);
  const { markAllRead } = useMarkAllNotificationsRead(currentUser?.id);
  const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const searchQuery = useGlobalSearch(debouncedSearchTerm);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => window.clearTimeout(handler);
  }, [searchTerm]);

  const showSearchResults = searchOpen && debouncedSearchTerm.length > 0;
  const searchUsers = searchQuery.data?.users ?? [];
  const searchPosts = searchQuery.data?.posts ?? [];
  const hasSearchResults = (searchUsers.length > 0 || searchPosts.length > 0) && !searchQuery.isError;
  const searchResultsEmpty = showSearchResults && !searchQuery.isFetching && !hasSearchResults;

  const handleResultClick = (url: string) => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchTerm("");
    setDebouncedSearchTerm("");
    router.push(url);
  };

  useEffect(() => {
    if (!searchOpen && !isMobileSearchOpen) return;

    function handleOutside(event: Event) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
        setMobileSearchOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [searchOpen, isMobileSearchOpen]);

  return (
    <header
      className="
        sticky
        top-0
        z-50
        h-20
        border-b
        border-orange-500/20
        bg-black/95
        backdrop-blur-xl
      "
    >
      <div
        className="
          flex
          h-full
          items-center
          justify-between
          gap-6
          px-6
        "
      >
        {/* LEFT */}
        <div className="flex items-center gap-5">
          <SidebarTrigger
            className="
              text-zinc-400
              hover:bg-orange-500/10
              hover:text-orange-400
            "
          />
        </div>

        {/* SEARCH */}
        <div className="flex flex-1 justify-center relative" ref={searchRef}>
          {/* Desktop */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="relative w-full max-w-3xl">
              <InputGroup
                className="
                  h-14
                  rounded-2xl
                  border
                  border-orange-500/20
                  bg-zinc-950
                  shadow-[0_0_30px_rgba(255,115,0,0.08)]
                "
              >
                <InputGroupAddon className="pl-4">
                  <Search className="h-5 w-5 text-zinc-500" />
                </InputGroupAddon>

                <InputGroupInput
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search for players and posts..."
                  className="
                    border-0
                    bg-transparent
                    text-white
                    placeholder:text-zinc-500
                    focus-visible:ring-0
                  "
                />

                <InputGroupAddon
                  align="inline-end"
                  className="pr-4 text-xs text-zinc-600"
                />
              </InputGroup>

              {showSearchResults && (
                <div
                  className="
                    absolute
                    inset-x-0
                    top-full
                    z-50
                    mt-2
                    overflow-hidden
                    rounded-3xl
                    border
                    border-orange-500/20
                    bg-zinc-950/95
                    text-white
                    shadow-2xl
                    backdrop-blur-xl
                  "
                >
                  <div className="space-y-3 p-4">
                    {searchQuery.isFetching && (
                      <div className="text-sm text-zinc-400">Searching...</div>
                    )}

                    {searchResultsEmpty && (
                      <div className="text-sm text-zinc-400">No users or posts found.</div>
                    )}

                    {searchUsers.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Users</div>
                        <div className="space-y-1">
                          {searchUsers.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleResultClick(ROUTES.profile(user.username))}
                              className="
                                w-full
                                text-left
                                rounded-2xl
                                px-3
                                py-2
                                transition-colors
                                hover:bg-orange-500/10
                                hover:text-white
                              "
                            >
                              <div className="text-sm font-medium">{user.displayName ?? user.username}</div>
                              <div className="text-xs text-zinc-500">@{user.username}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchPosts.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Posts</div>
                        <div className="space-y-1">
                          {searchPosts.map((post) => (
                            <button
                              key={post.id}
                              type="button"
                              onClick={() => handleResultClick(ROUTES.post(post.id))}
                              className="
                                w-full
                                text-left
                                rounded-2xl
                                px-3
                                py-2
                                transition-colors
                                hover:bg-orange-500/10
                                hover:text-white
                              "
                            >
                              <div className="text-sm font-medium">{post.content?.slice(0, 80) ?? post.gameName ?? "Untitled post"}</div>
                              <div className="text-xs text-zinc-500">{post.gameName ? `Game: ${post.gameName}` : "Feed post"}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: icon toggles expanded input */}
          <div className="flex md:hidden items-center justify-center w-full">
            {!isMobileSearchOpen ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSearchOpen(true)}
                className="
                  h-12
                  w-12
                  rounded-xl
                  bg-zinc-950
                  text-zinc-400
                  hover:bg-orange-500/10
                  hover:text-orange-400
                "
                aria-label="Open search"
              >
                <Search className="h-5 w-5" />
              </Button>
            ) : (
              <div className="w-full px-3">
                <div className="relative">
                  <InputGroup
                    className="
                      h-12
                      w-full
                      rounded-2xl
                      border
                      border-orange-500/20
                      bg-zinc-950
                      shadow-[0_0_20px_rgba(255,115,0,0.06)]
                      transition-all
                      duration-200
                      ease-out
                    "
                  >
                    <InputGroupAddon className="pl-3">
                      <Search className="h-5 w-5 text-zinc-500" />
                    </InputGroupAddon>

                    <InputGroupInput
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      onFocus={() => setSearchOpen(true)}
                      autoFocus
                      placeholder="Search for players and posts..."
                      className="
                        border-0
                        bg-transparent
                        text-white
                        placeholder:text-zinc-500
                        focus-visible:ring-0
                      "
                    />

                    <InputGroupAddon align="inline-end" className="pr-3">
                      <button
                        onClick={() => {
                          setMobileSearchOpen(false);
                          setSearchOpen(false);
                        }}
                        className="
                          h-8
                          w-8
                          rounded
                          text-zinc-400
                          hover:text-orange-400
                        "
                        aria-label="Close search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </InputGroupAddon>
                  </InputGroup>

                  {showSearchResults && (
                    <div
                      className="
                        absolute
                        inset-x-0
                        top-full
                        z-50
                        mt-2
                        overflow-hidden
                        rounded-3xl
                        border
                        border-orange-500/20
                        bg-zinc-950/95
                        text-white
                        shadow-2xl
                        backdrop-blur-xl
                      "
                    >
                      <div className="space-y-3 p-4">
                        {searchQuery.isFetching && (
                          <div className="text-sm text-zinc-400">Searching...</div>
                        )}

                        {searchResultsEmpty && (
                          <div className="text-sm text-zinc-400">No users or posts found.</div>
                        )}

                        {searchUsers.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Users</div>
                            <div className="space-y-1">
                              {searchUsers.map((user) => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => handleResultClick(ROUTES.profile(user.username))}
                                  className="
                                    w-full
                                    text-left
                                    rounded-2xl
                                    px-3
                                    py-2
                                    transition-colors
                                    hover:bg-orange-500/10
                                    hover:text-white
                                  "
                                >
                                  <div className="text-sm font-medium">{user.displayName ?? user.username}</div>
                                  <div className="text-xs text-zinc-500">@{user.username}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {searchPosts.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Posts</div>
                            <div className="space-y-1">
                              {searchPosts.map((post) => (
                                <button
                                  key={post.id}
                                  type="button"
                                  onClick={() => handleResultClick(ROUTES.post(post.id))}
                                  className="
                                    w-full
                                    text-left
                                    rounded-2xl
                                    px-3
                                    py-2
                                    transition-colors
                                    hover:bg-orange-500/10
                                    hover:text-white
                                  "
                                >
                                  <div className="text-sm font-medium">{post.content?.slice(0, 80) ?? post.gameName ?? "Untitled post"}</div>
                                  <div className="text-xs text-zinc-500">{post.gameName ? `Game: ${post.gameName}` : "Feed post"}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className={`${isMobileSearchOpen ? 'hidden md:flex items-center gap-3' : 'flex items-center gap-3'}`}>
          {/* NOTIFICATIONS */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="
                  relative
                  h-12
                  w-12
                  rounded-xl
                  border
                  border-transparent
                  bg-zinc-950
                  text-zinc-400
                  hover:border-orange-500/30
                  hover:bg-orange-500/10
                  hover:text-orange-400
                "
              >
                <Bell className="h-5 w-5" />

                {unread && unread > 0 && (
                  <span
                    className="
                      absolute
                      right-1
                      top-1
                      flex
                      h-5
                      min-w-5
                      items-center
                      justify-center
                      rounded-full
                      bg-orange-500
                      px-1
                      text-[10px]
                      font-bold
                      text-black
                    "
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="
                w-80
                border-orange-500/20
                bg-zinc-950
                text-white
              "
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="text-sm font-semibold">Notifications</div>
                  <button
                    onClick={async () => {
                      try {
                        if (!currentUser?.id) return;
                        if (unreadList.length === 0) return;
                        await markAllRead();
                      } catch (err) {
                        console.error("Failed to mark all notifications read", err);
                      }
                    }}
                    disabled={unreadList.length === 0}
                    className={`text-xs ${unreadList.length === 0 ? "text-zinc-600 opacity-50 cursor-not-allowed" : "text-zinc-400 hover:text-orange-400"}`}
                  >
                    Mark all read
                  </button>
                </div>

                <div className="border-t border-orange-500/10" />

                {notificationsQuery.isLoading && (
                  <div className="px-3 py-2 text-zinc-400">Loading...</div>
                )}

                {notificationsQuery.isError && (
                  <div className="px-3 py-2 text-red-400">Failed to load notifications</div>
                )}

                {!notificationsQuery.isLoading && unreadList.length === 0 && (
                  <div className="px-3 py-2 text-zinc-500">No unread notifications</div>
                )}

                {unreadList.length > 0 && (
                  <ul className="max-h-64 overflow-auto">
                    {unreadList.map((n: any) => (
                      <li
                        key={n.id}
                        className="px-3 py-2 hover:bg-zinc-900 cursor-pointer"
                        onClick={async () => {
                          try {
                            if (!currentUser?.id) return;
                            await markNotificationRead(n.id);
                          } catch (err) {
                            console.error("Failed to mark notification read", err);
                          }
                        }}
                      >
                        <div className="text-sm text-zinc-200">{n.title ?? n.body ?? "Notification"}</div>
                        {n.body && <div className="text-xs text-zinc-500">{n.body}</div>}
                        <div className="text-xs text-zinc-600">{n.createdAt ?? ""}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* MESSAGES */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="
                  relative
                  h-12
                  w-12
                  rounded-xl
                  bg-zinc-950
                  text-zinc-400
                  hover:bg-orange-500/10
                  hover:text-orange-400
                "
              >
                <MessageSquare className="h-5 w-5" />
                {messageUnreadList.length > 0 && (
                  <span
                    className="
                      absolute
                      right-1
                      top-1
                      flex
                      h-5
                      min-w-5
                      items-center
                      justify-center
                      rounded-full
                      bg-orange-500
                      px-1
                      text-[10px]
                      font-bold
                      text-black
                    "
                  >
                    {messageUnreadList.length > 99 ? "99+" : messageUnreadList.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="
                w-80
                border-orange-500/20
                bg-zinc-950
                text-white
              "
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">Messages</div>
                    {messageUnreadList.length > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-orange-500 px-2 py-0.5 text-xs font-semibold text-black">
                        {messageUnreadList.length > 99 ? "99+" : messageUnreadList.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-orange-500/10" />

                {notificationsQuery.isLoading && (
                  <div className="px-3 py-2 text-zinc-400">Loading...</div>
                )}

                {notificationsQuery.isError && (
                  <div className="px-3 py-2 text-red-400">Failed to load messages</div>
                )}

                {!notificationsQuery.isLoading && messageUnreadList.length === 0 && (
                  <div className="px-3 py-2 text-zinc-500">No new messages</div>
                )}

                {messageUnreadList.length > 0 && (
                  <ul className="max-h-64 overflow-auto">
                    {messageUnreadList.map((n: any) => {
                      const conversationId = n.data?.conversationId ?? n.data?.conversation_id;
                      const snippet = n.body ?? "New message";
                      return (
                        <li
                          key={n.id}
                          className="px-3 py-2 hover:bg-zinc-900 cursor-pointer"
                          onClick={async () => {
                            try {
                              if (!currentUser?.id) return;
                              await markNotificationRead(n.id);

                              // navigate to conversation if available
                              if (conversationId) {
                                router.push(`/messages/${conversationId}`);
                              } else {
                                // fallback: open messages page
                                router.push(`/messages`);
                              }
                            } catch (err) {
                              console.error("Failed to open message from notification", err);
                            }
                          }}
                        >
                          <div className="text-sm text-zinc-200">{snippet}</div>
                          <div className="text-xs text-zinc-500">{n.createdAt ?? ""}</div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* DIVIDER */}
          <div
            className="
              mx-1
              h-10
              w-px
              bg-orange-500/20
            "
          />

          {/* PROFILE */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  border-orange-500/20
                  bg-zinc-950
                  px-2
                  py-1.5
                  transition-all
                  hover:border-orange-500/40
                  hover:bg-orange-500/10
                "
              >
                <Avatar
                  className="
                    h-11
                    w-11
                    border
                    border-orange-500/30
                  "
                >
                  {/* <Image src={currentUser?.avatarUrl ?? undefined} alt={currentUser?.username ?? "user"} /> */}
                  {currentUser?.avatarUrl ? (
                    <Image
                      src={currentUser?.avatarUrl}
                      alt={currentUser?.displayName ?? currentUser?.username}
                      width={40}
                      height={40}
                      className="object-cover w-10 h-10 rounded-full overflow-hidden"
                    />
                  ) : (
                    <AvatarFallback>
                      {((currentUser?.displayName ?? currentUser?.username ?? "U")[0] ?? "U").toUpperCase()}
                    </AvatarFallback>
                  )}

                </Avatar>

                <ChevronDown
                  className="
                    mr-1
                    h-4
                    w-4
                    text-zinc-500
                  "
                />
              </button>
            </PopoverTrigger>

            <PopoverContent
              className="
                w-56
                border-orange-500/20
                bg-zinc-950
                p-2
                text-white
              "
              align="end"
            >
              <div className="flex flex-col gap-1">
                <Link
                  href={currentUser?.username ? `/profile/${currentUser.username}` : "/settings"}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-sm
                    text-zinc-300
                    transition-colors
                    hover:bg-orange-500/10
                    hover:text-orange-400
                  "
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>

                <Link
                  href="/settings"
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-sm
                    text-zinc-300
                    transition-colors
                    hover:bg-orange-500/10
                    hover:text-orange-400
                  "
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>

                <div className="my-1 h-px bg-orange-500/10" />

                <button
                  onClick={signOut}
                  disabled={isLoading}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-sm
                    text-red-400
                    transition-colors
                    hover:bg-red-500/10
                  "
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}