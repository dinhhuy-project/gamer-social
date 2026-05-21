"use client";

import * as React from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  IconHome,
  IconBookmark,
  IconShoppingCart,
  IconBrandMessenger,
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

const data = {
  navMain: [
    {
      title: "Home Page",
      url: "/feed",
      icon: IconHome,
    },
    {
      title: "Saved Posts",
      url: "/saved",
      icon: IconBookmark,
    },
    {
      title: "Market Place",
      url: "/marketplace",
      icon: IconShoppingCart,
    },
    {
      title: "Messenger",
      url: "/messages",
      icon: IconBrandMessenger,
    },
  ],
};

export function AppSidebar(
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
        <SidebarMenu className="space-y-2">
          {data.navMain.map((item) => {
            const isActive =
              pathname === item.url;

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
      </SidebarContent>
    </Sidebar>
  );
}