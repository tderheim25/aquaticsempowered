import type { OrgTier, UserRole } from "@/types/database";

export type PilotImportRow = {
  line: number;
  orgName: string;
  orgTier: OrgTier | null;
  facilityName: string;
  userEmail: string;
  userFullName: string;
  userRole: UserRole;
  isOwner: boolean;
};

export type PilotCsvParseResult =
  | { ok: true; rows: PilotImportRow[] }
  | { ok: false; errors: string[] };

const ORG_TIERS: OrgTier[] = [
  "rural",
  "municipal",
  "hotel",
  "school",
  "hospital",
  "hoa",
  "splash_pad",
  "wellness",
  "commercial",
  "therapy",
];

const USER_ROLES: UserRole[] = ["org_admin", "manager", "staff"];

const REQUIRED_HEADERS = [
  "org_name",
  "org_tier",
  "facility_name",
  "user_email",
  "user_full_name",
  "user_role",
  "is_owner",
] as const;

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function yesNo(value: string): boolean | null {
  const v = value.trim().toLowerCase();
  if (v === "yes" || v === "true" || v === "1") return true;
  if (v === "no" || v === "false" || v === "0" || v === "") return false;
  return null;
}

function parseTier(raw: string): OrgTier | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  return ORG_TIERS.includes(s as OrgTier) ? (s as OrgTier) : null;
}

function parseRole(raw: string): UserRole | null {
  const s = raw.trim().toLowerCase();
  return USER_ROLES.includes(s as UserRole) ? (s as UserRole) : null;
}

export function parsePilotImportCsv(text: string): PilotCsvParseResult {
  const errors: string[] = [];
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length < 2) {
    return { ok: false, errors: ["CSV must include a header row and at least one data row."] };
  }

  const header = parseCsvLine(lines[0]!).map((h) => h.toLowerCase());
  for (const required of REQUIRED_HEADERS) {
    if (!header.includes(required)) {
      errors.push(`Missing required column: ${required}`);
    }
  }
  if (errors.length > 0) return { ok: false, errors };

  const idx = Object.fromEntries(header.map((h, i) => [h, i])) as Record<
    (typeof REQUIRED_HEADERS)[number],
    number
  >;

  const rows: PilotImportRow[] = [];
  const seenEmails = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const lineNum = i + 1;
    const cols = parseCsvLine(lines[i]!);
    const get = (key: (typeof REQUIRED_HEADERS)[number]) => cols[idx[key]] ?? "";

    const orgName = get("org_name").trim();
    const userEmail = get("user_email").trim().toLowerCase();
    const userFullName = get("user_full_name").trim();
    const tierRaw = get("org_tier");
    const facilityName = get("facility_name").trim() || orgName;
    const roleRaw = get("user_role");
    const isOwnerRaw = get("is_owner");

    if (!orgName) errors.push(`Line ${lineNum}: org_name is required`);
    if (!userEmail || !userEmail.includes("@")) {
      errors.push(`Line ${lineNum}: valid user_email is required`);
    }
    if (!userFullName) errors.push(`Line ${lineNum}: user_full_name is required`);

    const orgTier = parseTier(tierRaw);
    if (tierRaw.trim() && !orgTier) {
      errors.push(`Line ${lineNum}: invalid org_tier "${tierRaw}"`);
    }

    const userRole = parseRole(roleRaw);
    if (!userRole) {
      errors.push(`Line ${lineNum}: user_role must be org_admin, manager, or staff`);
    }

    const isOwner = yesNo(isOwnerRaw);
    if (isOwner === null) {
      errors.push(`Line ${lineNum}: is_owner must be yes or no`);
    }

    if (userEmail && seenEmails.has(userEmail)) {
      errors.push(`Line ${lineNum}: duplicate user_email ${userEmail} in CSV`);
    }
    if (userEmail) seenEmails.add(userEmail);

    if (orgName && userEmail && userFullName && userRole && isOwner !== null) {
      rows.push({
        line: lineNum,
        orgName,
        orgTier,
        facilityName,
        userEmail,
        userFullName,
        userRole,
        isOwner,
      });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, rows };
}
