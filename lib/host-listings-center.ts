/**
 * Host listings portfolio — presentation helpers mirroring
 * app/[locale]/host/(portal)/listings/page.tsx behavior exactly.
 * Does not redefine backend listing lifecycle rules.
 */

import type { HostListingSummary } from "./stays-types";
import { getListingMediaUrl } from "./stays-api";

export type HostListingFilterId =
  | "all"
  | "active"
  | "pending"
  | "paused"
  | "draft"
  | "needs_changes";

export const HOST_LISTING_FILTER_ORDER: HostListingFilterId[] = [
  "all",
  "active",
  "pending",
  "paused",
  "draft",
  "needs_changes",
];

/** Preserve: DRAFT/REJECTED → wizard draft; else → edit. */
export function listingHref(
  listing: HostListingSummary,
  localePath: (path: string) => string,
): string {
  if (listing.status === "DRAFT" || listing.status === "REJECTED") {
    return localePath(`/host/listings/new?draft=${listing.id}`);
  }
  return localePath(`/host/listings/${listing.id}/edit`);
}

/** Preserve: LIVE | APPROVED may show public View. */
export function listingIsPublic(status: string): boolean {
  return status === "LIVE" || status === "APPROVED";
}

/** Preserve: LIVE | APPROVED may Pause. */
export function listingCanPause(status: string): boolean {
  return status === "LIVE" || status === "APPROVED";
}

export function listingCanResume(status: string): boolean {
  return status === "PAUSED";
}

export function listingIsContinueSetup(status: string): boolean {
  return status === "DRAFT" || status === "REJECTED";
}

/**
 * Preserve host-facing labels from the listings index.
 * i18n layer may wrap these keys; raw fallback matches prior page strings.
 */
export function hostFacingStatusKey(status: string): string {
  if (status === "REJECTED") return "hostPortal.listings.statusNeedsChanges";
  if (status === "SUBMITTED") return "hostPortal.listings.statusInReview";
  if (status === "DRAFT") return "hostPortal.listings.statusDraft";
  if (status === "LIVE") return "hostPortal.listings.statusLive";
  if (status === "APPROVED") return "hostPortal.listings.statusApproved";
  if (status === "PAUSED") return "hostPortal.listings.statusPaused";
  return "";
}

/** Fallback English labels when i18n key missing (parity with old page). */
export function hostFacingStatusFallback(status: string): string {
  if (status === "REJECTED") return "Needs Changes";
  if (status === "SUBMITTED") return "In review";
  if (status === "DRAFT") return "Draft";
  return status;
}

export function listingStatusTone(
  status: string,
): "neutral" | "success" | "warning" | "danger" | "primary" {
  if (status === "LIVE" || status === "APPROVED") return "success";
  if (status === "SUBMITTED") return "warning";
  if (status === "PAUSED") return "neutral";
  if (status === "REJECTED") return "danger";
  if (status === "DRAFT") return "primary";
  return "neutral";
}

export function matchesHostListingFilter(
  listing: HostListingSummary,
  filter: HostListingFilterId,
): boolean {
  const s = listing.status;
  switch (filter) {
    case "all":
      return true;
    case "active":
      return s === "LIVE" || s === "APPROVED";
    case "pending":
      return s === "SUBMITTED";
    case "paused":
      return s === "PAUSED";
    case "draft":
      return s === "DRAFT";
    case "needs_changes":
      return s === "REJECTED";
    default:
      return true;
  }
}

export function matchesHostListingSearch(
  listing: HostListingSummary,
  search: string,
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const title = (listing.title || "").toLowerCase();
  const city = (listing.city || "").toLowerCase();
  return title.includes(q) || city.includes(q);
}

/** Filter + search only — preserves API response order (no invented sorts). */
export function filterHostListings(params: {
  listings: HostListingSummary[];
  filter: HostListingFilterId;
  search: string;
}): HostListingSummary[] {
  const { listings, filter, search } = params;
  return listings.filter(
    (l) =>
      matchesHostListingFilter(l, filter) &&
      matchesHostListingSearch(l, search),
  );
}

export function countHostListingsByFilter(
  listings: HostListingSummary[],
): Record<HostListingFilterId, number> {
  const result: Record<HostListingFilterId, number> = {
    all: listings.length,
    active: 0,
    pending: 0,
    paused: 0,
    draft: 0,
    needs_changes: 0,
  };
  for (const id of HOST_LISTING_FILTER_ORDER) {
    if (id === "all") continue;
    result[id] = listings.filter((l) => matchesHostListingFilter(l, id)).length;
  }
  return result;
}

/** Valid nightly only — hide when absent/invalid (never invent 0). */
export function listingNightlyAmount(
  listing: HostListingSummary,
): { amount: number; currency: string } | null {
  const plan = listing.rate_plan;
  if (!plan) return null;
  const amount = plan.base_price;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return { amount, currency: plan.currency || "MAD" };
}

/** Cover media URL or null → UI uses placeholder. */
export function listingCoverMediaUrl(
  listing: HostListingSummary,
): string | null {
  const media = listing.media;
  if (!Array.isArray(media) || media.length === 0) return null;
  const photos = media.filter(
    (m) =>
      m &&
      typeof m.asset_id === "string" &&
      m.asset_id.trim() &&
      (m.kind == null ||
        String(m.kind).toUpperCase() === "PHOTO" ||
        String(m.kind).toUpperCase() === "IMAGE"),
  );
  const pool = photos.length > 0 ? photos : media;
  const cover =
    pool.find((m) => m.is_cover) ??
    [...pool].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
  if (!cover?.asset_id?.trim()) return null;
  try {
    const url = getListingMediaUrl(listing.id, cover.asset_id);
    return url?.trim() ? url : null;
  } catch {
    return null;
  }
}

export function listingDisplayTitle(
  listing: HostListingSummary,
  untitledLabel: string,
): string {
  if (!listing.title?.trim() || listing.title === "Untitled listing") {
    return untitledLabel;
  }
  return listing.title;
}
