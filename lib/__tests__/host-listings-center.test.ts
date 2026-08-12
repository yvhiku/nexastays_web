import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HostListingSummary } from "../stays-types";
import {
  countHostListingsByFilter,
  filterHostListings,
  hostFacingStatusFallback,
  listingCanPause,
  listingCanResume,
  listingHref,
  listingIsContinueSetup,
  listingIsPublic,
  listingNightlyAmount,
  matchesHostListingFilter,
  matchesHostListingSearch,
  sortHostListings,
} from "../host-listings-center";

function listing(
  partial: Partial<HostListingSummary> & Pick<HostListingSummary, "id" | "status">,
): HostListingSummary {
  return {
    title: "Villa Test",
    listing_type: "VILLA",
    city: "Casablanca",
    created_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

const localePath = (p: string) => `/en${p}`;

describe("host-listings-center", () => {
  it("listingHref routes draft/rejected to wizard and others to edit", () => {
    assert.equal(
      listingHref(listing({ id: "a", status: "DRAFT" }), localePath),
      "/en/host/listings/new?draft=a",
    );
    assert.equal(
      listingHref(listing({ id: "b", status: "REJECTED" }), localePath),
      "/en/host/listings/new?draft=b",
    );
    assert.equal(
      listingHref(listing({ id: "c", status: "LIVE" }), localePath),
      "/en/host/listings/c/edit",
    );
    assert.equal(
      listingHref(listing({ id: "d", status: "SUBMITTED" }), localePath),
      "/en/host/listings/d/edit",
    );
  });

  it("public / pause / resume / continue-setup eligibility", () => {
    assert.equal(listingIsPublic("LIVE"), true);
    assert.equal(listingIsPublic("APPROVED"), true);
    assert.equal(listingIsPublic("PAUSED"), false);
    assert.equal(listingCanPause("LIVE"), true);
    assert.equal(listingCanPause("DRAFT"), false);
    assert.equal(listingCanResume("PAUSED"), true);
    assert.equal(listingCanResume("LIVE"), false);
    assert.equal(listingIsContinueSetup("DRAFT"), true);
    assert.equal(listingIsContinueSetup("REJECTED"), true);
    assert.equal(listingIsContinueSetup("LIVE"), false);
  });

  it("hostFacingStatusFallback mirrors prior page strings", () => {
    assert.equal(hostFacingStatusFallback("REJECTED"), "Needs Changes");
    assert.equal(hostFacingStatusFallback("SUBMITTED"), "In review");
    assert.equal(hostFacingStatusFallback("DRAFT"), "Draft");
    assert.equal(hostFacingStatusFallback("LIVE"), "LIVE");
  });

  it("filters and search preserve order", () => {
    const rows = [
      listing({ id: "1", status: "LIVE", title: "Riad Medina", city: "Marrakech" }),
      listing({ id: "2", status: "DRAFT", title: "Apartment", city: "Casablanca" }),
      listing({ id: "3", status: "PAUSED", title: "Villa Atlas", city: "Rabat" }),
      listing({ id: "4", status: "SUBMITTED", title: "Studio", city: "Fes" }),
      listing({ id: "5", status: "REJECTED", title: "Needs work", city: "Tangier" }),
      listing({ id: "6", status: "APPROVED", title: "Approved loft", city: "Casablanca" }),
    ];
    assert.equal(matchesHostListingFilter(rows[0], "active"), true);
    assert.equal(matchesHostListingFilter(rows[5], "active"), true);
    assert.equal(matchesHostListingFilter(rows[1], "draft"), true);
    assert.equal(matchesHostListingSearch(rows[0], "medina"), true);
    assert.equal(matchesHostListingSearch(rows[2], "rabat"), true);
    assert.equal(matchesHostListingSearch(rows[2], "xyz"), false);

    const filtered = filterHostListings({
      listings: rows,
      filter: "active",
      search: "casa",
    });
    assert.deepEqual(
      filtered.map((r) => r.id),
      ["6"],
    );

    const counts = countHostListingsByFilter(rows);
    assert.equal(counts.all, 6);
    assert.equal(counts.active, 2);
    assert.equal(counts.draft, 1);
    assert.equal(counts.pending, 1);
    assert.equal(counts.paused, 1);
    assert.equal(counts.needs_changes, 1);
  });

  it("sortHostListings title uses index as final tie-breaker", () => {
    const rows = [
      listing({ id: "1", status: "LIVE", title: "Alpha", city: "Fes" }),
      listing({ id: "2", status: "LIVE", title: "Alpha", city: "Rabat" }),
      listing({ id: "3", status: "LIVE", title: "Beta", city: "Casablanca" }),
    ];
    assert.deepEqual(
      sortHostListings(rows, "title").map((r) => r.id),
      ["1", "2", "3"],
    );
    assert.deepEqual(
      sortHostListings(rows, "city").map((r) => r.id),
      ["3", "1", "2"],
    );
    assert.deepEqual(
      sortHostListings(rows, "default").map((r) => r.id),
      ["1", "2", "3"],
    );
  });

  it("listingNightlyAmount hides invalid prices", () => {
    assert.equal(listingNightlyAmount(listing({ id: "1", status: "LIVE" })), null);
    assert.equal(
      listingNightlyAmount(
        listing({
          id: "2",
          status: "LIVE",
          rate_plan: { base_price: 0, currency: "MAD" },
        }),
      ),
      null,
    );
    assert.deepEqual(
      listingNightlyAmount(
        listing({
          id: "3",
          status: "LIVE",
          rate_plan: { base_price: 450, currency: "MAD" },
        }),
      ),
      { amount: 450, currency: "MAD" },
    );
  });
});
