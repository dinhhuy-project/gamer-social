"use client";

import * as React from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  IconShieldLock,
  IconFileText,
  IconShoppingCart,
  IconArrowLeft,
  IconDeviceNintendo,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const adminMenuItems = [
  {
    title: "Manage Users",
    url: "/admin/users",
    icon: IconShieldLock,
  },
  {
    title: "Manage Posts",
    url: "/admin/posts",
    icon: IconFileText,
  },
  {
    title: "Review Listings",
    url: "/admin/listings",
    icon: IconShoppingCart,
  },
];

export function AdminSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="offcanvas"
      className="
        border-r
        border-orange-500/20
        bg-black
      "
      {...props}
    >
      <SidebarHeader
        className="
          border-b
          border-orange-500/20
          px-4
          py-5
        "
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="
                h-auto
                p-0
                hover:bg-transparent
                active:bg-transparent
              "
            >
              <Link
                href="/"
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-orange-500/30
                    bg-orange-500/10
                    shadow-[0_0_20px_rgba(255,115,0,0.25)]
                  "
                >
                  <IconDeviceNintendo
                    className="
                      h-6
                      w-6
                      text-orange-500
                    "
                  />
                </div>

                <span
                  className="
                    text-2xl
                    font-black
                    tracking-wide
                    text-white
                  "
                >
                  SOCI
                  <span className="text-orange-500">
                    ARA
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <div className="mb-6 space-y-2">
          <h3 className="px-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Admin Panel
          </h3>
        </div>

        <SidebarMenu className="space-y-2">
          {adminMenuItems.map((item) => {
            const isActive =
              pathname === item.url || pathname.startsWith(`${item.url}/`);

            return (
              <SidebarMenuItem
                key={item.title}
              >
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className={`
                    h-14
                    rounded-xl
                    transition-all
                    duration-200

                    ${isActive
                      ? `
                          bg-orange-500/15
                          text-orange-400
                          border
                          border-orange-500/30
                          shadow-[0_0_25px_rgba(255,115,0,0.15)]
                        `
                      : `
                          text-zinc-400
                          hover:bg-zinc-900
                          hover:text-white
                        `
                    }
                  `}
                >
                  <Link
                    href={item.url}
                    className="
                      flex
                      items-center
                      gap-4
                      px-4
                    "
                  >
                    <item.icon
                      className="
                        h-6
                        w-6
                        shrink-0
                      "
                    />

                    <span
                      className="
                        text-[15px]
                        font-medium
                      "
                    >
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <div className="mt-8 pt-6 border-t border-orange-500/20">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Back to Home"
                className="
                  h-14
                  rounded-xl
                  text-zinc-400
                  hover:bg-zinc-900
                  hover:text-white
                  transition-all
                  duration-200
                "
              >
                <Link
                  href="/feed"
                  className="
                    flex
                    items-center
                    gap-4
                    px-4
                  "
                >
                  <IconArrowLeft
                    className="
                      h-6
                      w-6
                      shrink-0
                    "
                  />

                  <span
                    className="
                      text-[15px]
                      font-medium
                    "
                  >
                    Back to Home
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
