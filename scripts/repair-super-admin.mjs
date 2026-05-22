/**
 * One-off: restore super_admin on public.users for a given email.
 * Usage: node --env-file=.env.local scripts/repair-super-admin.mjs [email]
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/repair-super-admin.mjs <email>");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (listErr) {
  console.error("Auth listUsers failed:", listErr.message);
  process.exit(1);
}

const authUser = listData.users.find((u) => (u.email ?? "").toLowerCase() === email);
if (!authUser) {
  console.error(`No auth.users row for ${email}. Sign up or create the user in Supabase Auth first.`);
  process.exit(1);
}

const { data: appRole } = await admin.from("app_roles").select("id").eq("slug", "super_admin").maybeSingle();

const row = {
  id: authUser.id,
  email,
  full_name:
    (typeof authUser.user_metadata?.full_name === "string" && authUser.user_metadata.full_name) || null,
  role: "super_admin",
  org_id: null,
  ...(appRole?.id ? { app_role_id: appRole.id } : {}),
};

const { data: before } = await admin.from("users").select("id, role, org_id").eq("id", authUser.id).maybeSingle();

const { error: upsertErr } = await admin.from("users").upsert(row, { onConflict: "id" });
if (upsertErr) {
  console.error("users upsert failed:", upsertErr.message);
  process.exit(1);
}

const { data: after } = await admin.from("users").select("id, email, role, org_id, app_role_id").eq("id", authUser.id).single();

console.log("Super admin repaired for", email);
console.log("Auth user id:", authUser.id);
if (before) console.log("Before:", before);
console.log("After:", after);
console.log("\nSign out and sign in again, then open /private/ae-console");
