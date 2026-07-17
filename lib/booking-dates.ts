/** Read YYYY-MM-DD from URL params (supports legacy key variants). */
export function readDateSearchParam(
  searchParams: URLSearchParams,
  keys: string[],
): string {
  for (const key of keys) {
    const value = searchParams.get(key)?.trim();
    if (value) return value;
  }
  return "";
}

/**
 * Parse a calendar date without UTC shift.
 * `new Date("YYYY-MM-DD")` is UTC midnight and can land on the previous local day.
 */
export function parseLocalDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const trimmed = value.trim();
  // Exact calendar dates only — do not strip time from ISO timestamps.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );
  }
  const d = new Date(trimmed);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatLocalDateOnly(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
  locale?: string,
): string {
  return parseLocalDateOnly(value).toLocaleDateString(locale, options);
}

export function addDaysToDateString(isoDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const d = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function bookingNights(checkin: string, checkout: string): number {
  const ci = /^(\d{4})-(\d{2})-(\d{2})$/.exec(checkin);
  const co = /^(\d{4})-(\d{2})-(\d{2})$/.exec(checkout);
  if (!ci || !co) return 0;
  const a = new Date(Number(ci[1]), Number(ci[2]) - 1, Number(ci[3])).getTime();
  const b = new Date(Number(co[1]), Number(co[2]) - 1, Number(co[3])).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function isValidBookingRange(checkin: string, checkout: string): boolean {
  return bookingNights(checkin, checkout) >= 1;
}

/** Expand [checkin, checkout) ranges into occupied night ISO dates. */
export function expandBlockedNights(
  ranges: Array<{ checkin_date: string; checkout_date: string }>,
): string[] {
  const nights = new Set<string>();
  for (const range of ranges) {
    let cursor = range.checkin_date;
    while (cursor < range.checkout_date) {
      nights.add(cursor);
      cursor = addDaysToDateString(cursor, 1);
    }
  }
  return [...nights];
}

/** True if any night in [checkin, checkout) is blocked. */
export function rangeOverlapsBlockedNights(
  checkin: string,
  checkout: string,
  blockedNights: string[],
): boolean {
  if (!checkin || !checkout || blockedNights.length === 0) return false;
  const blocked = new Set(blockedNights);
  let cursor = checkin;
  while (cursor < checkout) {
    if (blocked.has(cursor)) return true;
    cursor = addDaysToDateString(cursor, 1);
  }
  return false;
}

