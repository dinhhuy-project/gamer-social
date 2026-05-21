"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

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
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";

export function SiteHeader() {
  const { signOut, isLoading } = useAuthActions();
  const { data: currentUser } = useCurrentUser();
  const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMobileSearchOpen) return;

    function handleOutside(event: Event) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setMobileSearchOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileSearchOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isMobileSearchOpen]);

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
        <div className="flex flex-1 justify-center">
          {/* Desktop */}
          <div className="hidden md:flex flex-1 justify-center">
            <InputGroup
              className="
                h-14
                max-w-3xl
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
                placeholder="Search for games, players, posts..."
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
              <div ref={searchRef} className="w-full px-3">
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
                    autoFocus
                    placeholder="Search for games, players, posts..."
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
                      onClick={() => setMobileSearchOpen(false)}
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
                  3
                </span>
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
              Notifications
            </PopoverContent>
          </Popover>

          {/* MESSAGES */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="
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
              Messages
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
                  <AvatarImage src="/images/avatar-placeholder.png" />

                  <AvatarFallback>
                    U
                  </AvatarFallback>
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