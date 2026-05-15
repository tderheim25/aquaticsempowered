import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: BrowserClient | undefined;

/**
 * Single browser Supabase client so auth token refresh and Realtime share one session.
 * Creating a new client per hook/effect can trigger overlapping refresh requests and
 * console "Failed to fetch" noise from @supabase/auth-js.
 */
export function createClient(): BrowserClient {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  browserClient = createBrowserClient(url, key);
  return browserClient;
}

/** True when Supabase auth could not reach the server or the refresh token is invalid. */
export function isSupabaseAuthTransportError(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed") ||
    m.includes("refresh token") ||
    m.includes("refresh_token_not_found")
  );
}
