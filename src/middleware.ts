import { type NextRequest, NextResponse } from "next/server";

import { homePathForRole, isSupportTechnicianAllowedAppPath, isVendorAllowedAppPath } from "@/lib/auth/homePath";
import { getUserRoleForMiddleware } from "@/lib/auth/middlewareProfile";
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

  if (pathname === "/app/community") {
    const url = request.nextUrl.clone();
    url.pathname = "/community";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/app/community/profile/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/app/community/profile/", "/community/profile/");
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/app") || pathname.startsWith("/private") || pathname.startsWith("/portal")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (user) {
    const role = await getUserRoleForMiddleware(supabase, user.id);

    if (pathname.startsWith("/portal") && role !== "support_technician" && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    if (role === "support_technician" && pathname.startsWith("/app") && !isSupportTechnicianAllowedAppPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/queue";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (role === "vendor" && pathname.startsWith("/app") && !isVendorAllowedAppPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/vendor";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (role === "vendor" && (pathname === "/app" || pathname === "/app/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/vendor";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (isAuthPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = homePathForRole(role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
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
