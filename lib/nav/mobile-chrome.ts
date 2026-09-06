import { isMessagingThreadPath } from "@/lib/messaging/thread-routes";
import { portalPathnameWithoutLocale } from "@/components/host/portal/portal-nav";

/** Locale-stripped path (`/en/host/dashboard` → `/host/dashboard`). */
export function stripLocalePath(pathname: string): string {
  return portalPathnameWithoutLocale(pathname);
}

/**
 * Host portal chrome routes (HostPortalShell + HostPortalMobileBottomNav).
 * Excludes bare `/host` apply flow and listing wizard/edit outside `(portal)`.
 */
export function isHostPortalPath(pathname: string): boolean {
  const p = stripLocalePath(pathname);
  if (p === "/host/dashboard" || p.startsWith("/host/dashboard/")) return true;
  if (p === "/host/bookings" || p.startsWith("/host/bookings/")) return true;
  if (p === "/host/inbox" || p.startsWith("/host/inbox/")) return true;
  if (p === "/host/analytics" || p.startsWith("/host/analytics/")) return true;
  if (p === "/host/reviews" || p.startsWith("/host/reviews/")) return true;
  // Portal listings index only — `/host/listings/new` and `/host/listings/:id/edit` are outside portal.
  if (p === "/host/listings" || p === "/host/listings/") return true;
  return false;
}

/** Guest booking detail `/bookings/:id` — not `/bookings` or `/my-bookings`. */
export function isBookingDetailPath(pathname: string): boolean {
  const p = stripLocalePath(pathname);
  return /^\/bookings\/[^/]+\/?$/.test(p);
}

/**
 * Routes where generic guest MobileBottomNav + LocaleShell guest pad should hide.
 * Host portal is handled separately via `isHostPortalPath`.
 */
export function isImmersiveMobilePath(pathname: string): boolean {
  return isMessagingThreadPath(pathname) || isBookingDetailPath(pathname);
}
