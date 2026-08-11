import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  HOST_ANALYTICS_DEFAULT_PERIOD,
  buildHostAnalyticsPath,
  formatOccupancyDisplay,
  isHostAnalyticsEmpty,
  parseHostAnalyticsPeriod,
  sumHostAnalyticsProperties,
} from "../host-analytics";
import { HOST_ANALYTICS_PERIODS, type HostAnalyticsProperty } from "../stays-types";

const read = (path: string) => readFileSync(path, "utf8");

function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flattenKeys(v, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

function property(
  partial: Partial<HostAnalyticsProperty> & Pick<HostAnalyticsProperty, "listing_id">,
): HostAnalyticsProperty {
  return {
    title: "Stay",
    city: "Casablanca",
    status: "LIVE",
    bookings: {
      total: 0,
      payment_pending: 0,
      upcoming: 0,
      current: 0,
      completed: 0,
      cancelled: 0,
    },
    nights: { booked_in_period: 0 },
    earnings: {
      gross_revenue: 0,
      net_host_earnings: 0,
      platform_fees: 0,
      upcoming_revenue_30d: 0,
    },
    occupancy: { value: 0, basis: "BOOKED_NIGHTS_OVER_PERIOD_DAYS_V1" },
    reviews: { avg_rating: null, total_reviews: 0 },
    operations: {
      checkins_today: 0,
      checkouts_today: 0,
      next_checkin_date: null,
      upcoming_bookings: 0,
      currently_staying: 0,
    },
    payouts: { pending: 0, paid_out: 0 },
    health: {
      completion_percentage: 0,
      photos_complete: false,
      calendar_status: "NONE",
      missing: [],
      attention: [],
    },
    ...partial,
  };
}

describe("host-analytics helpers", () => {
  it("defaults and parses only H10 periods", () => {
    assert.equal(parseHostAnalyticsPeriod(null), HOST_ANALYTICS_DEFAULT_PERIOD);
    assert.equal(parseHostAnalyticsPeriod("last_30_days"), "this_month");
    for (const id of HOST_ANALYTICS_PERIODS) {
      assert.equal(parseHostAnalyticsPeriod(id), id);
    }
  });

  it("builds analytics path with period and never hostId", () => {
    assert.equal(
      buildHostAnalyticsPath("previous_month"),
      "/stays/host/analytics?period=previous_month",
    );
    assert.doesNotMatch(buildHostAnalyticsPath("all_time"), /hostId|host_id/);
  });

  it("renders occupancy null as unavailable label, never 0%", () => {
    assert.equal(formatOccupancyDisplay(null, "N/A"), "N/A");
    assert.equal(formatOccupancyDisplay(undefined, "N/A"), "N/A");
    assert.equal(formatOccupancyDisplay(12.9, "N/A"), "12.9%");
    assert.notEqual(formatOccupancyDisplay(null, "N/A"), "0%");
  });

  it("sums property earnings/nights without inventing occupancy averages", () => {
    const totals = sumHostAnalyticsProperties([
      property({
        listing_id: "a",
        nights: { booked_in_period: 4 },
        earnings: {
          gross_revenue: 100,
          net_host_earnings: 80,
          platform_fees: 20,
          upcoming_revenue_30d: 50,
        },
        bookings: {
          total: 2,
          payment_pending: 0,
          upcoming: 1,
          current: 0,
          completed: 1,
          cancelled: 0,
        },
        reviews: { avg_rating: 5, total_reviews: 1 },
      }),
      property({
        listing_id: "b",
        nights: { booked_in_period: 6 },
        earnings: {
          gross_revenue: 200,
          net_host_earnings: 170,
          platform_fees: 30,
          upcoming_revenue_30d: 0,
        },
        bookings: {
          total: 1,
          payment_pending: 0,
          upcoming: 0,
          current: 0,
          completed: 1,
          cancelled: 0,
        },
        reviews: { avg_rating: 4, total_reviews: 2 },
      }),
    ]);
    assert.equal(totals.properties, 2);
    assert.equal(totals.booked_nights, 10);
    assert.equal(totals.net_host_earnings, 250);
    assert.equal(totals.gross_revenue, 300);
    assert.equal(totals.bookings_total, 3);
    assert.equal(totals.total_reviews, 3);
  });

  it("detects empty properties list", () => {
    assert.equal(isHostAnalyticsEmpty({ properties: [] }), true);
    assert.equal(
      isHostAnalyticsEmpty({ properties: [property({ listing_id: "x" })] }),
      false,
    );
  });
});

describe("host-analytics web integration (source)", () => {
  it("stays-api exposes getHostAnalytics against H10 periods", () => {
    const source = read("lib/stays-api.ts");
    assert.match(source, /export async function getHostAnalytics/);
    assert.match(source, /buildHostAnalyticsPath/);
    assert.match(source, /getHostAnalytics,/);
    assert.doesNotMatch(source, /getHostAnalytics[\s\S]{0,500}hostId/);
  });

  it("types preserve nested H10 contract", () => {
    const source = read("lib/stays-types.ts");
    assert.match(source, /export interface HostAnalyticsResponse/);
    assert.match(source, /export interface HostAnalyticsProperty/);
    for (const key of [
      "bookings",
      "nights",
      "earnings",
      "occupancy",
      "reviews",
      "operations",
      "payouts",
      "health",
      "end_exclusive",
      "BOOKED_NIGHTS_OVER_PERIOD_DAYS_V1",
    ]) {
      assert.match(source, new RegExp(key));
    }
  });

  it("page supports four periods, occupancy footnote, empty/error/retry", () => {
    const page = read("components/host/HostAnalyticsPage.tsx");
    assert.match(page, /getHostAnalytics\(/);
    assert.match(page, /parseHostAnalyticsPeriod/);
    assert.match(page, /hostAnalytics\.retry/);
    assert.match(page, /hostAnalytics\.emptyTitle/);
    assert.match(page, /occupancyFootnote/);
    assert.match(page, /HostAnalyticsPropertyTable/);
    assert.match(page, /HostAnalyticsPropertyCard/);
    assert.match(page, /localePath\("\/host\/reviews"\)/);
    assert.doesNotMatch(page, /last_30_days|sparkline|LineChart|needs.?response/i);
    assert.doesNotMatch(page, /\bm[lr]-|\bleft-|\bright-/);
  });

  it("occupancy display helper used for null → N/A", () => {
    const card = read("components/host/HostAnalyticsPropertyCard.tsx");
    const table = read("components/host/HostAnalyticsPropertyTable.tsx");
    assert.match(card, /formatOccupancyDisplay/);
    assert.match(table, /formatOccupancyDisplay/);
    assert.match(card, /occupancyUnavailable/);
    assert.match(table, /occupancyUnavailable/);
  });

  it("dashboard CTAs navigate to analytics", () => {
    const hero = read("components/host/HostDashboardHero.tsx");
    const snapshot = read("components/host/HostBusinessSnapshot.tsx");
    const dash = read("app/[locale]/host/dashboard/page.tsx");
    assert.match(hero, /localePath\("\/host\/analytics"\)/);
    assert.match(snapshot, /localePath\("\/host\/analytics"\)/);
    assert.match(dash, /localePath=\{localePath\}/);
    assert.match(read("app/[locale]/host/analytics/page.tsx"), /HostAnalyticsPage/);
  });

  it("keeps EN/FR/AR hostAnalytics key parity", () => {
    const en = JSON.parse(read("lib/i18n/locales/en.json"));
    const fr = JSON.parse(read("lib/i18n/locales/fr.json"));
    const ar = JSON.parse(read("lib/i18n/locales/ar.json"));
    const enKeys = flattenKeys(en.hostAnalytics).sort();
    assert.deepEqual(flattenKeys(fr.hostAnalytics).sort(), enKeys);
    assert.deepEqual(flattenKeys(ar.hostAnalytics).sort(), enKeys);
    assert.ok(enKeys.includes("occupancyUnavailable"));
    assert.ok(enKeys.includes("occupancyFootnote"));
    assert.ok(enKeys.includes("periodNext30d"));
  });
});
