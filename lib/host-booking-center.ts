/**
 * H6 Booking Center — presentation-layer classification only.
 * Domain statuses stay unchanged; urgency/filters derive from existing dates + status.
 * Calendar day boundaries use Africa/Casablanca (H3), without adding luxon to the web app.
 */

import type { HostBooking } from "./stays-types";
import { bookingNights } from "./booking-dates";

export const HOST_DASHBOARD_TZ = "Africa/Casablanca";

export type HostBookingDomainStatus =
  | "INITIATED"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED_BY_GUEST"
  | "CANCELLED_BY_HOST"
  | "EXPIRED";

export type HostBookingFilterId =
  | "all"
  | "today"
  | "checkin_today"
  | "checkout_today"
  | "upcoming"
  | "current"
  | "awaiting_payment"
  | "completed"
  | "cancelled";

export type HostBookingUrgency =
  | "checkout_today"
  | "checkin_today"
  | "checkin_tomorrow"
  | "awaiting_payment"
  | "staying"
  | "upcoming"
  | "completed"
  | "cancelled"
  | "other";

const STAY_ACTIVE = new Set(["CONFIRMED", "CHECKED_IN"]);
const CHECKOUT_ELIGIBLE = new Set(["CONFIRMED", "CHECKED_IN", "COMPLETED"]);
const PAYMENT_PENDING = new Set(["INITIATED", "PAYMENT_PENDING"]);
const CANCELLED = new Set(["CANCELLED_BY_GUEST", "CANCELLED_BY_HOST", "EXPIRED"]);

const URGENCY_RANK: Record<HostBookingUrgency, number> = {
  checkout_today: 0,
  checkin_today: 1,
  checkin_tomorrow: 2,
  awaiting_payment: 3,
  staying: 4,
  upcoming: 5,
  completed: 6,
  cancelled: 7,
  other: 8,
};

/** Casablanca calendar YYYY-MM-DD for an instant (default now). */
export function casablancaYmd(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: HOST_DASHBOARD_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function addCalendarDaysYmd(ymd: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days);
  const d = new Date(utc);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function toBookingDateYmd(value: string | Date): string {
  if (typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const d = value instanceof Date ? value : new Date(value);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function isPaymentPendingStatus(status: string): boolean {
  return PAYMENT_PENDING.has(status);
}

export function isCancelledStatus(status: string): boolean {
  return CANCELLED.has(status);
}

export function classifyHostBookingUrgency(
  booking: HostBooking,
  todayYmd: string,
  tomorrowYmd: string = addCalendarDaysYmd(todayYmd, 1),
): HostBookingUrgency {
  const status = booking.status;
  const checkin = toBookingDateYmd(booking.checkin_date);
  const checkout = toBookingDateYmd(booking.checkout_date);

  if (
    CHECKOUT_ELIGIBLE.has(status) &&
    checkout === todayYmd
  ) {
    return "checkout_today";
  }
  if (STAY_ACTIVE.has(status) && checkin === todayYmd) {
    return "checkin_today";
  }
  if (STAY_ACTIVE.has(status) && checkin === tomorrowYmd) {
    return "checkin_tomorrow";
  }
  if (PAYMENT_PENDING.has(status)) {
    return "awaiting_payment";
  }
  if (
    STAY_ACTIVE.has(status) &&
    checkin <= todayYmd &&
    checkout > todayYmd
  ) {
    return "staying";
  }
  if (STAY_ACTIVE.has(status) && checkin > todayYmd) {
    return "upcoming";
  }
  if (status === "COMPLETED") return "completed";
  if (CANCELLED.has(status)) return "cancelled";
  return "other";
}

export function matchesHostBookingFilter(
  booking: HostBooking,
  filter: HostBookingFilterId,
  todayYmd: string,
  tomorrowYmd: string = addCalendarDaysYmd(todayYmd, 1),
): boolean {
  const status = booking.status;
  const checkin = toBookingDateYmd(booking.checkin_date);
  const checkout = toBookingDateYmd(booking.checkout_date);
  const urgency = classifyHostBookingUrgency(booking, todayYmd, tomorrowYmd);

  switch (filter) {
    case "all":
      return true;
    case "today":
      return urgency === "checkin_today" || urgency === "checkout_today";
    case "checkin_today":
      return urgency === "checkin_today";
    case "checkout_today":
      return urgency === "checkout_today";
    case "upcoming":
      return (
        STAY_ACTIVE.has(status) &&
        checkin > todayYmd
      );
    case "current":
      return urgency === "staying" || (urgency === "checkin_today" && checkout > todayYmd);
    case "awaiting_payment":
      return PAYMENT_PENDING.has(status);
    case "completed":
      return status === "COMPLETED";
    case "cancelled":
      return CANCELLED.has(status);
    default:
      return true;
  }
}

export function matchesHostBookingSearch(
  booking: HostBooking,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    booking.guest_name ?? "",
    booking.listing?.title ?? "",
    booking.id,
    booking.booking_reference ?? "",
    booking.listing_id,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function sortHostBookingsForOps(
  bookings: HostBooking[],
  todayYmd: string,
  tomorrowYmd: string = addCalendarDaysYmd(todayYmd, 1),
): HostBooking[] {
  return [...bookings].sort((a, b) => {
    const ua = classifyHostBookingUrgency(a, todayYmd, tomorrowYmd);
    const ub = classifyHostBookingUrgency(b, todayYmd, tomorrowYmd);
    const rank = URGENCY_RANK[ua] - URGENCY_RANK[ub];
    if (rank !== 0) return rank;
    const ca = toBookingDateYmd(a.checkin_date);
    const cb = toBookingDateYmd(b.checkin_date);
    if (ca !== cb) return ca < cb ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
}

/** Audited fields: checkin_date, checkout_date, total_subtotal, guest_name. */
export type HostBookingSortId =
  | "ops"
  | "checkin"
  | "checkout"
  | "amount"
  | "guest";

export const HOST_BOOKING_SORT_ORDER: HostBookingSortId[] = [
  "ops",
  "checkin",
  "checkout",
  "amount",
  "guest",
];

export function isHostBookingSortId(
  value: string | null | undefined,
): value is HostBookingSortId {
  return (
    !!value &&
    (HOST_BOOKING_SORT_ORDER as readonly string[]).includes(value)
  );
}

function compareNullableStringAsc(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

/**
 * Client sort with original-index final tie-breaker (except ops, which keeps
 * its existing urgency → check-in → id ordering).
 */
export function sortHostBookings(
  bookings: HostBooking[],
  sort: HostBookingSortId,
  todayYmd: string,
  tomorrowYmd: string = addCalendarDaysYmd(todayYmd, 1),
): HostBooking[] {
  if (sort === "ops") {
    return sortHostBookingsForOps(bookings, todayYmd, tomorrowYmd);
  }

  const indexed = bookings.map((item, index) => ({ item, index }));
  indexed.sort((a, b) => {
    let cmp = 0;
    if (sort === "checkin") {
      cmp = compareNullableStringAsc(
        toBookingDateYmd(a.item.checkin_date),
        toBookingDateYmd(b.item.checkin_date),
      );
    } else if (sort === "checkout") {
      cmp = compareNullableStringAsc(
        toBookingDateYmd(a.item.checkout_date),
        toBookingDateYmd(b.item.checkout_date),
      );
    } else if (sort === "amount") {
      cmp = Number(a.item.total_subtotal) - Number(b.item.total_subtotal);
    } else if (sort === "guest") {
      cmp = compareNullableStringAsc(
        (a.item.guest_name ?? "").trim(),
        (b.item.guest_name ?? "").trim(),
      );
    }
    return cmp !== 0 ? cmp : a.index - b.index;
  });
  return indexed.map(({ item }) => item);
}

/** Filter + search only — preserves input relative order (sort separately). */
export function filterHostBookings(options: {
  bookings: HostBooking[];
  filter: HostBookingFilterId;
  listingId?: string;
  search?: string;
  todayYmd: string;
  tomorrowYmd?: string;
}): HostBooking[] {
  const tomorrow =
    options.tomorrowYmd ?? addCalendarDaysYmd(options.todayYmd, 1);
  return options.bookings.filter((b) => {
    if (options.listingId && b.listing_id !== options.listingId) return false;
    if (!matchesHostBookingFilter(b, options.filter, options.todayYmd, tomorrow)) {
      return false;
    }
    if (!matchesHostBookingSearch(b, options.search ?? "")) return false;
    return true;
  });
}

export function hostBookingNights(booking: HostBooking): number {
  return bookingNights(
    toBookingDateYmd(booking.checkin_date),
    toBookingDateYmd(booking.checkout_date),
  );
}

/** Prefer known payout; otherwise show total_paid when present. Never invent paid=true. */
export function hostBookingAmountDisplay(booking: HostBooking): {
  amount: number | null;
  kind: "payout" | "total_paid" | "none";
} {
  if (booking.payout_amount != null) {
    return { amount: Number(booking.payout_amount), kind: "payout" };
  }
  if (booking.total_paid != null) {
    return { amount: Number(booking.total_paid), kind: "total_paid" };
  }
  return { amount: null, kind: "none" };
}

/** Map presentation filter → CSV export status when unambiguous; else undefined. */
export function exportStatusForBookingFilter(
  filter: HostBookingFilterId,
): string | undefined {
  switch (filter) {
    case "awaiting_payment":
      return "PAYMENT_PENDING";
    case "completed":
      return "COMPLETED";
    case "cancelled":
      return undefined; // multiple domain statuses — leave export status unset
    default:
      return undefined;
  }
}

export const HOST_BOOKING_FILTER_ORDER: HostBookingFilterId[] = [
  "all",
  "today",
  "upcoming",
  "current",
  "awaiting_payment",
  "completed",
  "cancelled",
];

/** Every valid filter id (includes focused ops filters omitted from tab ORDER). */
export const HOST_BOOKING_FILTER_IDS: readonly HostBookingFilterId[] = [
  "all",
  "today",
  "checkin_today",
  "checkout_today",
  "upcoming",
  "current",
  "awaiting_payment",
  "completed",
  "cancelled",
] as const;

export function isHostBookingFilterId(
  value: string,
): value is HostBookingFilterId {
  return (HOST_BOOKING_FILTER_IDS as readonly string[]).includes(value);
}