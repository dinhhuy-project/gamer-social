import { createServerClient } from "@supabase/ssr";

import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export async function middleware(
  request: NextRequest
) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) =>
              request.cookies.set(
                name,
                value
              )
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) =>
              response.cookies.set(
                name,
                value,
                options
              )
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname =
    request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const protectedRoutes = [
    "/feed",
    "/messages",
    "/marketplace",
    "/notifications",
    "/saved",
    "/settings",
  ];

  const isProtected =
    protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

  if (!user && isProtected) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(
      new URL("/feed", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/register",

    "/feed/:path*",
    "/messages/:path*",
    "/marketplace/:path*",
    "/notifications/:path*",
    "/saved/:path*",
    "/settings/:path*",
  ],
};