import { NextResponse } from "next/server";

import { homePathForUserId } from "@/lib/auth/middlewareProfile";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const defaultHome = await homePathForUserId(supabase, data.user.id);
      const safeNext =
        nextParam && nextParam.startsWith("/") ? nextParam : defaultHome;
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
}
