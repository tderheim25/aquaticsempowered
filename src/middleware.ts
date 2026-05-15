import { type NextRequest, NextResponse } from "next/server";

import { createMiddlewareClient } from "@/lib/supabase/middleware";

const AUTH_PATHS = ["/login", "/signup", "/forgot", "/check-email"];

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createMiddlewareClient(request, response);
  if (!supabase) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/app")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (isAuthPath(pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Do not run auth redirects on Server Action POSTs (header `next-action`) or RSC
     * navigations (`RSC`). Middleware returning HTML/302 for those breaks the client with
     * "An unexpected response was received from the server." Let the route/action run;
     * server code still calls Supabase and can `redirect()` with the correct action/RSC response.
     *
     * Also skip documented prefetch headers so middleware matches real navigations only.
     */
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "next-action" },
        { type: "header", key: "RSC" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
