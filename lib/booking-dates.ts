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
