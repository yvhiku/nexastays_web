import type { HostBooking, HostDashboardStats, HostListingSummary } from "./stays-types";

const EARNING_STATUSES = new Set(["CONFIRMED", "CHECKED_IN", "COMPLETED"]);
const PENDING_STATUSES = new Set(["INITIATED", "PAYMENT_PENDING"]);
const ACTIVE_STATUSES = new Set(["CONFIRMED", "CHECKED_IN"]);

function hostPayout(booking: HostBooking): number {
  if (booking.payout_amount != null) return booking.payout_amount;
  const hostFee = booking.host_fee ?? 0;
  return Math.max(0, booking.total_subtotal - hostFee);
}

/** Client-side fallback when GET /stays/host/stats is unavailable. */
export function computeHostDashboardStats(
  bookings: HostBooking[],
  listings: HostListingSummary[],
  reviewsSummary?: { overall_avg_rating: number | null; total_count: number },
): HostDashboardStats {
  const now = new Date();

  let totalEarnings = 0;
  let thisMonthEarnings = 0;
  for (const b of bookings) {
    if (!EARNING_STATUSES.has(b.status)) continue;
    const payout = hostPayout(b);
    totalEarnings += payout;
    const checkin = new Date(b.checkin_date);
    if (
      checkin.getFullYear() === now.getFullYear() &&
      checkin.getMonth() === now.getMonth()
    ) {
      thisMonthEarnings += payout;
    }
  }

  const currency = bookings.find((b) => b.currency)?.currency ?? "MAD";

  return {
    total_earnings: Math.round(totalEarnings * 100) / 100,
    this_month_earnings: Math.round(thisMonthEarnings * 100) / 100,
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
    live_listings: listings.filter((l) => l.status === "LIVE").length,
    pending_listings: listings.filter(
      (l) => l.status === "SUBMITTED" || l.status === "DRAFT",
    ).length,
    total_listings: listings.length,
    avg_rating: reviewsSummary?.overall_avg_rating ?? null,
    total_reviews: reviewsSummary?.total_count ?? 0,
  };
}

export function formatHostCurrency(amount: number, currency: string): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString()} ${currency}`;
}
