/**
 * Phase 7 source integrity — locks verified Host Portal invariants.
 * Does not invent production behavior.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(join(root, rel));
}

describe("Phase 7 host portal integrity", () => {
  it("keeps verification page-level (not in portal layout)", () => {
    const layout = read("app/[locale]/host/(portal)/layout.tsx");
    assert.match(layout, /HostPortalShell/);
    assert.match(layout, /ProtectedRoute/);
    assert.doesNotMatch(layout, /getHostVerification/);
  });

  it("preserves legacy Host* components on disk", () => {
    for (const rel of [
      "components/host/HostTodaySection.tsx",
      "components/host/HostUpcomingSection.tsx",
      "components/host/HostPayoutStatus.tsx",
      "components/host/HostDashboardHero.tsx",
      "components/host/HostBusinessSnapshot.tsx",
      "components/host/HostCalendarSyncPanel.tsx",
      "components/host/HostBookingCenter.tsx",
      "components/host/HostBookingFilters.tsx",
      "components/host/HostBookingRow.tsx",
      "components/host/HostAnalyticsPage.tsx",
      "components/host/HostReviewsPage.tsx",
    ]) {
      assert.ok(exists(rel), `missing legacy file: ${rel}`);
    }
  });

  it("insights package rejects fake charts / ADR / RevPAR / forecast", () => {
    const insights = read("components/host/analytics/HostInsightsPage.tsx");
    assert.doesNotMatch(insights, /sparkline|LineChart|ADR|RevPAR|forecast/i);
  });

  it("reviews package rejects reply / invent filters", () => {
    const page = read("components/host/reviews/HostReviewsPage.tsx");
    const card = read("components/host/reviews/HostReviewCard.tsx");
    for (const source of [page, card]) {
      assert.doesNotMatch(
        source,
        /needs.?response|unread_reviews|Reply|Respond|response_rate|sentiment/i,
      );
    }
  });

  it("dashboard recent reviews distinguish error from empty", () => {
    const recent = read(
      "components/host/dashboard/HostDashboardRecentReviews.tsx",
    );
    const route = read("app/[locale]/host/(portal)/(content)/dashboard/page.tsx");
    assert.match(recent, /error/);
    assert.match(recent, /onRetry/);
    assert.match(route, /recentReviewsError/);
    assert.match(route, /bookingsError/);
  });

  it("mobile menu exposes aria-expanded", () => {
    const top = read("components/host/portal/HostPortalTopBar.tsx");
    assert.match(top, /aria-expanded=\{drawerOpen\}/);
    assert.match(top, /aria-controls="host-portal-mobile-drawer"/);
  });
});
