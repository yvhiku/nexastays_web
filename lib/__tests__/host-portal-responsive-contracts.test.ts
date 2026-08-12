import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Contract checks for verified Host Portal responsive fixes.
 * Complements viewport validation — does not replace visual checks.
 */
describe("host portal responsive layout contracts", () => {
  const root = process.cwd();

  it("HostPayoutStatus stacks metrics (no viewport-based 3-col)", () => {
    const src = readFileSync(
      join(root, "components/host/HostPayoutStatus.tsx"),
      "utf8",
    );
    assert.match(src, /grid grid-cols-1 gap-4/);
    assert.doesNotMatch(src, /sm:grid-cols-3/);
    assert.match(src, /pendingPayout/);
    assert.match(src, /availablePayout/);
    assert.match(src, /paidOutPayout/);
  });

  it("HostInsightsProperties shows table only at xl+", () => {
    const src = readFileSync(
      join(root, "components/host/analytics/HostInsightsProperties.tsx"),
      "utf8",
    );
    assert.match(src, /hidden overflow-x-auto p-0 xl:block/);
    assert.match(src, /space-y-4 xl:hidden/);
    assert.doesNotMatch(src, /lg:block/);
    assert.doesNotMatch(src, /lg:hidden/);
    assert.match(src, /min-w-\[56rem\]/);
  });

  it("HostInsightsPropertyCard uses stacked label/value metric rows", () => {
    const src = readFileSync(
      join(root, "components/host/analytics/HostInsightsPropertyCard.tsx"),
      "utf8",
    );
    assert.doesNotMatch(src, /dl className="grid grid-cols-2/);
    assert.match(src, /flex items-baseline justify-between gap-3/);
    assert.match(src, /shrink-0 text-end/);
    assert.match(src, /hostAnalytics\.netEarnings/);
    assert.match(src, /hostAnalytics\.grossRevenue/);
    assert.match(src, /hostAnalytics\.bookingsTotal/);
  });

  it("Today action rows allow label shrink without crushing CTA", () => {
    const src = readFileSync(
      join(root, "components/host/HostTodaySection.tsx"),
      "utf8",
    );
    assert.match(src, /min-w-0 flex-1 text-sm text-nexa-ink/);
    assert.match(src, /shrink-0 text-xs font-medium text-nexa-ink-3/);
  });

  it("does not touch pagination modules", () => {
    // Sanity: these files must still exist with cursor/loadMore contracts.
    const hook = readFileSync(join(root, "lib/use-host-cursor-list.ts"), "utf8");
    assert.match(hook, /loadMore/);
    assert.match(hook, /queryKey/);
  });
});
