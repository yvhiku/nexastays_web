import type {
  HostAnalyticsPeriodId,
  HostAnalyticsProperty,
  HostAnalyticsResponse,
} from "@/lib/stays-types";
import { HOST_ANALYTICS_PERIODS } from "@/lib/stays-types";

export const HOST_ANALYTICS_DEFAULT_PERIOD: HostAnalyticsPeriodId = "this_month";

export function isHostAnalyticsPeriodId(
  value: string | null | undefined,
): value is HostAnalyticsPeriodId {
  return (
    !!value &&
    (HOST_ANALYTICS_PERIODS as readonly string[]).includes(value)
  );
}

export function parseHostAnalyticsPeriod(
  raw: string | null | undefined,
): HostAnalyticsPeriodId {
  return isHostAnalyticsPeriodId(raw) ? raw : HOST_ANALYTICS_DEFAULT_PERIOD;
}

/** Build path for GET /stays/host/analytics (no hostId). */
export function buildHostAnalyticsPath(period?: HostAnalyticsPeriodId): string {
  const id = parseHostAnalyticsPeriod(period);
  const q = new URLSearchParams();
  q.set("period", id);
  return `/stays/host/analytics?${q.toString()}`;
}

/**
 * Presentation-only totals of H10 property rows.
 * Does not invent formulas — sums backend-provided fields only.
 * Never averages occupancy percentages.
 */
export function sumHostAnalyticsProperties(properties: HostAnalyticsProperty[]) {
  return properties.reduce(
    (acc, p) => {
      acc.properties += 1;
      acc.bookings_total += p.bookings.total;
      acc.booked_nights += p.nights.booked_in_period;
      acc.gross_revenue += p.earnings.gross_revenue;
      acc.net_host_earnings += p.earnings.net_host_earnings;
      acc.platform_fees += p.earnings.platform_fees;
      acc.upcoming_revenue_30d += p.earnings.upcoming_revenue_30d;
      acc.total_reviews += p.reviews.total_reviews;
      return acc;
    },
    {
      properties: 0,
      bookings_total: 0,
      booked_nights: 0,
      gross_revenue: 0,
      net_host_earnings: 0,
      platform_fees: 0,
      upcoming_revenue_30d: 0,
      total_reviews: 0,
    },
  );
}

export function formatOccupancyDisplay(
  value: number | null | undefined,
  unavailableLabel: string,
): string {
  if (value == null || Number.isNaN(value)) return unavailableLabel;
  return `${value.toFixed(1)}%`;
}

export function isHostAnalyticsEmpty(
  payload: Pick<HostAnalyticsResponse, "properties">,
): boolean {
  return payload.properties.length === 0;
}
