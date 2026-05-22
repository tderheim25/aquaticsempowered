/**
 * Stable en-US formatting for tables (SSR + hydration safe).
 * Avoid `toLocaleDateString(undefined)` which follows OS/browser locale and mismatches the server.
 */
const TABLE_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const TABLE_TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatTableDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return TABLE_DATE.format(d);
}

export function formatTableTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return TABLE_TIME.format(d);
}
