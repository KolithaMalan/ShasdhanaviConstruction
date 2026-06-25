/**
 * Counts working days (Mon–Fri) between `start` and `end` inclusive.
 * Saturdays and Sundays are excluded. If `end` is omitted, today is used.
 */
export function calculateWorkingDays(start: Date | string, end?: Date | string): number {
  const from = new Date(start);
  const to = end ? new Date(end) : new Date();

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  if (from > to) return 0;

  // Normalize to midnight to avoid DST/time-of-day skew.
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  let count = 0;
  const cursor = new Date(from);
  while (cursor <= to) {
    const day = cursor.getDay(); // 0 Sun, 6 Sat
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function generateTempPassword(): string {
  // 12-char readable password: 3 letters + 3 digits + 3 letters + 3 digits
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const pick = (src: string, n: number) =>
    Array.from({ length: n }, () => src[Math.floor(Math.random() * src.length)]).join("");
  return `${pick(letters, 2)}${pick(lower, 2)}${pick(digits, 4)}${pick(letters, 2)}${pick(digits, 2)}`;
}

/** Format a Date as YYYY-MM-DD using local TZ — used for "unique days" grouping. */
export function localDateKey(d: Date | string): string {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Count distinct local-dates in a list of scan timestamps.
 * Phase 4: "working day" = any day an employee was scanned IN at least once.
 */
export function countWorkingDaysFromScans(timestamps: Array<Date | string>): number {
  const set = new Set<string>();
  for (const t of timestamps) set.add(localDateKey(t));
  return set.size;
}
