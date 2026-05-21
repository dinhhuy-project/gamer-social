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

  // Expose internal DB user id (if previously mapped) to downstream Node handlers via a secure httpOnly cookie.
  // This allows edge middleware to remain lightweight while server-side code can quickly access the internal id.
  const internalUserId = (user as any)?.user_metadata?.internal_user_id ?? null;
  if (internalUserId) {
    response.cookies.set("gamer_internal_user_id", internalUserId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  } else {
    // clear cookie when no user
    response.cookies.set("gamer_internal_user_id", "", { maxAge: 0, path: "/" });
  }

  const pathname =
    request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const protectedRoutes = [
    "/admin",
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