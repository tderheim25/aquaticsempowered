/**
 * Pilot bulk import CLI (uses service role — run locally only).
 *
 * Usage:
 *   node --env-file=.env.local scripts/pilot-import.mjs --csv path/to/pilot.csv
 *   node --env-file=.env.local scripts/pilot-import.mjs --csv path/to/pilot.csv --apply
 *   node --env-file=.env.local scripts/pilot-import.mjs --csv path/to/pilot.csv --apply --send-email
 *
 * Prefer AE Console → Pilot import when available. This script mirrors the same CSV format.
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

const PILOT_PLAN = "enterprise";
const PILOT_ACCESS_UNTIL = "2026-09-30T23:59:59.000Z";
const POOL_LICENSES = 5;

function parseArgs(argv) {
  const args = { csv: null, apply: false, sendEmail: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--apply") args.apply = true;
    else if (a === "--send-email") args.sendEmail = true;
    else if (a === "--csv") {
      args.csv = argv[i + 1] ?? null;
      i += 1;
    }
  }
  return args;
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else current += ch;
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const get = (k) => cols[idx[k]] ?? "";
    rows.push({
      line: i + 1,
      orgName: get("org_name").trim(),
      orgTier: get("org_tier").trim() || null,
      facilityName: get("facility_name").trim() || get("org_name").trim(),
      userEmail: get("user_email").trim().toLowerCase(),
      userFullName: get("user_full_name").trim(),
      userRole: get("user_role").trim().toLowerCase(),
      isOwner: ["yes", "true", "1"].includes(get("is_owner").trim().toLowerCase()),
    });
  }
  return rows;
}

function tempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = randomBytes(14);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function main() {
  const { csv, apply, sendEmail } = parseArgs(process.argv);
  if (!csv) {
    console.error("Usage: node scripts/pilot-import.mjs --csv pilot.csv [--apply] [--send-email]");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const text = readFileSync(resolve(csv), "utf8");
  const rows = parseCsv(text);

  console.log(`${apply ? "IMPORT" : "DRY RUN"}: ${rows.length} rows from ${csv}`);

  const orgGroups = new Map();
  for (const row of rows) {
    const list = orgGroups.get(row.orgName) ?? [];
    list.push(row);
    orgGroups.set(row.orgName, list);
  }

  for (const [orgName, orgRows] of orgGroups) {
    console.log(`\nOrg: ${orgName} (${orgRows.length} users)`);

    let billingRootId = null;
    const { data: existingRoots } = await admin
      .from("organizations")
      .select("id, billing_org_id")
      .ilike("name", orgName);
    billingRootId = (existingRoots ?? []).find((o) => o.billing_org_id === o.id)?.id ?? null;

    if (!billingRootId && apply) {
      billingRootId = randomUUID();
      const { error } = await admin.from("organizations").insert({
        id: billingRootId,
        name: orgName,
        tier: orgRows[0].orgTier,
        plan_code: PILOT_PLAN,
        founder: true,
        billing_org_id: billingRootId,
        pilot_access_until: PILOT_ACCESS_UNTIL,
      });
      if (error) {
        console.error("  billing root error:", error.message);
        continue;
      }
      console.log("  created billing root", billingRootId);
    } else if (!billingRootId) {
      console.log("  would create billing root");
    } else {
      console.log("  existing billing root", billingRootId);
    }

    if (billingRootId && apply) {
      const subPayload = {
        plan_code: PILOT_PLAN,
        status: "active",
        current_period_end: PILOT_ACCESS_UNTIL,
        pool_license_quantity: POOL_LICENSES,
      };
      const { data: sub } = await admin
        .from("subscriptions")
        .select("id")
        .eq("org_id", billingRootId)
        .maybeSingle();
      if (sub?.id) {
        await admin.from("subscriptions").update(subPayload).eq("id", sub.id);
      } else {
        await admin.from("subscriptions").insert({ org_id: billingRootId, ...subPayload });
      }
    }

    for (const row of orgRows) {
      let facilityOrgId = billingRootId;
      if (row.facilityName !== orgName && billingRootId && apply) {
        const { data: fac } = await admin
          .from("organizations")
          .select("id")
          .eq("billing_org_id", billingRootId)
          .ilike("name", row.facilityName)
          .maybeSingle();
        if (fac?.id) facilityOrgId = fac.id;
        else {
          const { data: created } = await admin
            .from("organizations")
            .insert({
              name: row.facilityName,
              tier: row.orgTier,
              plan_code: PILOT_PLAN,
              founder: true,
              billing_org_id: billingRootId,
              pilot_access_until: PILOT_ACCESS_UNTIL,
            })
            .select("id")
            .single();
          facilityOrgId = created?.id ?? billingRootId;
        }
      }

      const { data: existingUser } = await admin
        .from("users")
        .select("id")
        .ilike("email", row.userEmail)
        .maybeSingle();

      if (!apply) {
        console.log(`  line ${row.line}: ${row.userEmail} (${existingUser ? "existing" : "new"})`);
        continue;
      }

      let userId = existingUser?.id ?? null;
      let password = null;
      if (!userId) {
        password = tempPassword();
        const { data: authData, error: authErr } = await admin.auth.admin.createUser({
          email: row.userEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name: row.userFullName, must_change_password: true },
        });
        if (authErr) {
          console.error(`  line ${row.line} auth error:`, authErr.message);
          continue;
        }
        userId = authData.user?.id ?? null;
      }

      if (!userId || !facilityOrgId) continue;

      const { data: roleRow } = await admin
        .from("app_roles")
        .select("id")
        .eq("slug", row.userRole)
        .maybeSingle();

      const founderEnrolledAt = new Date().toISOString();

      await admin.from("users").upsert({
        id: userId,
        email: row.userEmail,
        full_name: row.userFullName,
        role: row.userRole,
        org_id: facilityOrgId,
        is_founder: true,
        founder_enrolled_at: founderEnrolledAt,
        ...(roleRow?.id ? { app_role_id: roleRow.id } : {}),
      });

      await admin.from("organization_memberships").upsert(
        {
          user_id: userId,
          org_id: facilityOrgId,
          role: row.userRole,
          is_owner: row.isOwner,
        },
        { onConflict: "user_id,org_id" },
      );

      await admin.from("user_preferences").upsert({
        user_id: userId,
        active_org_id: facilityOrgId,
        updated_at: new Date().toISOString(),
      });

      console.log(`  line ${row.line}: ${row.userEmail} ${existingUser ? "linked" : "created"}`);
      if (password && sendEmail) {
        console.log(`    temp password (send via Resend / welcome email): ${password}`);
      }
    }
  }

  console.log("\nDone. Run post-import audit queries from supabase/scripts/RUN_THIS_pilot_org_seed.sql");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
