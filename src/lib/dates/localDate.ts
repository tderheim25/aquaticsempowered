/** YYYY-MM-DD in the server/runtime local timezone. */
export function localDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayBounds(dateStr: string): { start: string; end: string } {
  return { start: `${dateStr}T00:00:00`, end: `${dateStr}T23:59:59.999` };
}
