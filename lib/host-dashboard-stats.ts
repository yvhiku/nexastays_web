import type { HostBooking, HostDashboardStats, HostListingSummary } from "./stays-types";
import { parseLocalDateOnly } from "./booking-dates";

const EARNING_STATUSES = new Set(["CONFIRMED", "CHECKED_IN", "COMPLETED"]);
const PENDING_STATUSES = new Set(["INITIATED", "PAYMENT_PENDING"]);
const ACTIVE_STATUSES = new Set(["CONFIRMED", "CHECKED_IN"]);
const FUTURE_EARNING = new Set(["CONFIRMED", "CHECKED_IN"]);

function hostPayout(booking: HostBooking): number {
  if (booking.payout_amount != null) return booking.payout_amount;
  const hostFee = booking.host_fee ?? 0;
  return Math.max(0, booking.total_subtotal - hostFee);
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function bookedNightsInMonth(
  checkin: Date,
  checkout: Date,
  year: number,
  monthIndex: number,
): number {
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 1);
  const start = Math.max(checkin.getTime(), monthStart.getTime());
  const end = Math.min(checkout.getTime(), monthEnd.getTime());
  if (end <= start) return 0;
  return Math.round((end - start) / 86_400_000);
}

function momPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function lifecycle(
  booking: HostBooking,
  today: Date,
): "UPCOMING" | "ACTIVE" | "PENDING_PAYMENT" | "OTHER" {
  if (PENDING_STATUSES.has(booking.status)) return "PENDING_PAYMENT";
  if (!ACTIVE_STATUSES.has(booking.status) && booking.status !== "COMPLETED") {
    return "OTHER";
  }
  const checkin = parseLocalDateOnly(booking.checkin_date);
  const checkout = parseLocalDateOnly(booking.checkout_date);
  if (today >= checkin && today < checkout) return "ACTIVE";
  if (today < checkin && ACTIVE_STATUSES.has(booking.status)) return "UPCOMING";
  return "OTHER";
}

/** Client-side fallback when GET /stays/host/stats is unavailable. */
export function computeHostDashboardStats(
  bookings: HostBooking[],
  listings: HostListingSummary[],
  reviewsSummary?: { overall_avg_rating: number | null; total_count: number },
): HostDashboardStats {
  const now = new Date();
  const today = startOfLocalDay(now);
  const tomorrow = addDays(today, 1);
  const in30 = addDays(today, 30);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const liveListings = listings.filter((l) => l.status === "LIVE").length;

  let totalEarnings = 0;
  let thisMonthEarnings = 0;
  let previousMonthEarnings = 0;
  let upcomingRevenue30d = 0;
  let bookedNightsThisMonth = 0;
  let bookedNightsPrevMonth = 0;
  let upcomingCheckins = 0;
  let currentGuests = 0;
  let checkinsToday = 0;
  let checkoutsTomorrow = 0;
  let awaitingGuestPayment = 0;
  let nextCheckinDate: string | null = null;
  let nextGuestName: string | null = null;

  for (const b of bookings) {
    const checkin = parseLocalDateOnly(b.checkin_date);
    const checkout = parseLocalDateOnly(b.checkout_date);
    const life = lifecycle(b, today);

    if (life === "PENDING_PAYMENT") awaitingGuestPayment += 1;
    if (life === "UPCOMING") {
      upcomingCheckins += 1;
      if (!nextCheckinDate || checkin < parseLocalDateOnly(nextCheckinDate)) {
        nextCheckinDate = toIsoDate(checkin);
        nextGuestName = b.guest_name ?? null;
      }
    }
    if (life === "ACTIVE") currentGuests += 1;
    if (ACTIVE_STATUSES.has(b.status) && checkin.getTime() === today.getTime()) {
      checkinsToday += 1;
    }
    if (
      (ACTIVE_STATUSES.has(b.status) || b.status === "COMPLETED") &&
      checkout.getTime() === tomorrow.getTime()
    ) {
      checkoutsTomorrow += 1;
    }

    if (FUTURE_EARNING.has(b.status) && checkin >= today && checkin < in30) {
      upcomingRevenue30d += hostPayout(b);
    }

    if (!EARNING_STATUSES.has(b.status)) continue;
    const payout = hostPayout(b);
    totalEarnings += payout;
    if (
      checkin.getFullYear() === now.getFullYear() &&
      checkin.getMonth() === now.getMonth()
    ) {
      thisMonthEarnings += payout;
    }
    if (checkin >= prevMonthStart && checkin < monthStart) {
      previousMonthEarnings += payout;
    }
    bookedNightsThisMonth += bookedNightsInMonth(
      checkin,
      checkout,
      now.getFullYear(),
      now.getMonth(),
    );
    bookedNightsPrevMonth += bookedNightsInMonth(
      checkin,
      checkout,
      prevMonthStart.getFullYear(),
      prevMonthStart.getMonth(),
    );
  }

  const dim = daysInMonth(now.getFullYear(), now.getMonth());
  const capacity = dim * Math.max(liveListings, 1);
  const occupancyPctThisMonth =
    capacity > 0
      ? Math.min(100, Math.round((bookedNightsThisMonth / capacity) * 1000) / 10)
      : 0;
  const prevDim = daysInMonth(
    prevMonthStart.getFullYear(),
    prevMonthStart.getMonth(),
  );
  const prevCapacity = prevDim * Math.max(liveListings, 1);
  const occupancyPrev =
    prevCapacity > 0
      ? Math.min(100, Math.round((bookedNightsPrevMonth / prevCapacity) * 1000) / 10)
      : 0;

  const amounts = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    amounts.set(toIsoDate(addDays(today, -i)), 0);
  }
  for (const b of bookings) {
    if (!EARNING_STATUSES.has(b.status)) continue;
    const key = toIsoDate(parseLocalDateOnly(b.checkin_date));
    if (!amounts.has(key)) continue;
    amounts.set(key, (amounts.get(key) ?? 0) + hostPayout(b));
  }

  const photosComplete =
    listings.length > 0 &&
    listings.every((l) => l.completion_flags?.photos_complete);
  const avgCompletion =
    listings.length > 0
      ? Math.round(
          listings.reduce((s, l) => s + (l.completion_percentage ?? 0), 0) /
            listings.length,
        )
      : 0;

  const currency = bookings.find((b) => b.currency)?.currency ?? "MAD";

  return {
    total_earnings: Math.round(totalEarnings * 100) / 100,
    this_month_earnings: Math.round(thisMonthEarnings * 100) / 100,
    previous_month_earnings: Math.round(previousMonthEarnings * 100) / 100,
    earnings_mom_pct: momPct(thisMonthEarnings, previousMonthEarnings),
    upcoming_revenue_30d: Math.round(upcomingRevenue30d * 100) / 100,
    occupancy_pct_this_month: occupancyPctThisMonth,
    occupancy_mom_pct: momPct(occupancyPctThisMonth, occupancyPrev),
    avg_nightly_earnings:
      bookedNightsThisMonth > 0
        ? Math.round((thisMonthEarnings / bookedNightsThisMonth) * 100) / 100
        : null,
    currency,
    total_bookings: bookings.length,
    pending_bookings: bookings.filter((b) => PENDING_STATUSES.has(b.status)).length,
    active_bookings: bookings.filter((b) => ACTIVE_STATUSES.has(b.status)).length,
    completed_bookings: bookings.filter((b) => b.status === "COMPLETED").length,
    cancelled_bookings: bookings.filter(
      (b) =>
        b.status === "CANCELLED_BY_GUEST" ||
        b.status === "CANCELLED_BY_HOST" ||
        b.status === "EXPIRED",
    ).length,
    live_listings: liveListings,
    pending_listings: listings.filter(
      (l) => l.status === "SUBMITTED" || l.status === "DRAFT",
    ).length,
    total_listings: listings.length,
    avg_rating: reviewsSummary?.overall_avg_rating ?? null,
    total_reviews: reviewsSummary?.total_count ?? 0,
    upcoming_checkins: upcomingCheckins,
    next_checkin_date: nextCheckinDate,
    next_guest_name: nextGuestName,
    current_guests: currentGuests,
    checkins_today: checkinsToday,
    checkouts_tomorrow: checkoutsTomorrow,
    awaiting_guest_payment: awaitingGuestPayment,
    pending_payout_amount: null,
    calendar_status: { healthy: true, listings_needing_attention: 0 },
    revenue_series_30d: Array.from(amounts.entries()).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    })),
    listing_health: {
      verified_live: liveListings > 0,
      calendar_synced: false,
      photos_complete: !!photosComplete,
      avg_completion_pct: avgCompletion,
      missing: [],
    },
  };
}

export function formatHostCurrency(amount: number, currency: string): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString()} ${currency}`;
}

/** MoM display: clamp absurd swings when previous month is tiny. */
export function formatMomBadge(
  pct: number | null | undefined,
  t: (key: string) => string,
): { kind: "up" | "down" | "flat" | "new"; label: string } {
  if (pct == null || Number.isNaN(pct)) {
    return { kind: "new", label: t("hostDashboard.momNewRecord") };
  }
  if (Math.abs(pct) > 200) {
    return { kind: "new", label: t("hostDashboard.momNewRecord") };
  }
  if (pct === 0) {
    return { kind: "flat", label: t("hostDashboard.momFlat") };
  }
  const abs = Math.abs(pct).toFixed(1);
  if (pct > 0) {
    return {
      kind: "up",
      label: t("hostDashboard.momUp").replace("{pct}", abs),
    };
  }
  return {
    kind: "down",
    label: t("hostDashboard.momDown").replace("{pct}", abs),
  };
}
