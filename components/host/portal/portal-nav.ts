import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  MessageCircle,
  TrendingUp,
  Settings,
  Plus,
} from "lucide-react";

export type PortalNavId =
  | "home"
  | "bookings"
  | "listings"
  | "inbox"
  | "insights"
  | "settings";

export type PortalNavItem = {
  id: PortalNavId;
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** Match against pathname (locale-stripped). */
  match: (pathname: string) => boolean;
};

/** Strip leading locale segment for active-match helpers. */
export function portalPathnameWithoutLocale(pathname: string): string {
  const stripped = pathname.replace(/^\/(en|fr|ar)(?=\/|$)/, "") || "/";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

export const PORTAL_PRIMARY_NAV: PortalNavItem[] = [
  {
    id: "home",
    href: "/host/dashboard",
    labelKey: "hostPortal.nav.home",
    icon: LayoutDashboard,
    match: (p) => p === "/host/dashboard" || p.startsWith("/host/dashboard/"),
  },
  {
    id: "bookings",
    href: "/host/bookings",
    labelKey: "hostPortal.nav.bookings",
    icon: CalendarDays,
    match: (p) => p === "/host/bookings" || p.startsWith("/host/bookings/"),
  },
  {
    id: "listings",
    href: "/host/listings",
    labelKey: "hostPortal.nav.listings",
    icon: Building2,
    match: (p) => p === "/host/listings" || p.startsWith("/host/listings/"),
  },
  {
    id: "inbox",
    href: "/host/inbox",
    labelKey: "hostPortal.nav.inbox",
    icon: MessageCircle,
    match: (p) => p === "/host/inbox" || p.startsWith("/host/inbox/"),
  },
  {
    id: "insights",
    href: "/host/analytics",
    labelKey: "hostPortal.nav.insights",
    icon: TrendingUp,
    match: (p) => p === "/host/analytics" || p.startsWith("/host/analytics/"),
  },
];

export const PORTAL_MOBILE_BOTTOM_NAV: PortalNavItem[] = [
  PORTAL_PRIMARY_NAV[0],
  PORTAL_PRIMARY_NAV[1],
  PORTAL_PRIMARY_NAV[2],
  PORTAL_PRIMARY_NAV[4],
];

export const PORTAL_SETTINGS_NAV: PortalNavItem = {
  id: "settings",
  href: "/profile",
  labelKey: "hostPortal.nav.settings",
  icon: Settings,
  match: (p) => p === "/profile" || p.startsWith("/profile/"),
};

export const PORTAL_CTA = {
  href: "/host/listings/new",
  labelKey: "hostPortal.nav.listNewProperty",
  icon: Plus,
} as const;

export const PORTAL_TOP_SECONDARY = [
  {
    id: "portfolio",
    href: "/host/dashboard",
    labelKey: "hostPortal.top.portfolio",
    match: (p: string) =>
      p === "/host/dashboard" || p.startsWith("/host/dashboard/"),
  },
  {
    id: "calendar",
    href: "/host/bookings",
    labelKey: "hostPortal.top.calendar",
    match: (p: string) =>
      p === "/host/bookings" || p.startsWith("/host/bookings/"),
  },
] as const;
