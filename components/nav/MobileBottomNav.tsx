"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Heart,
  Briefcase,
  User,
  LayoutDashboard,
  CalendarCheck,
  Building2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { trackPwaPageView } from "@/lib/pwa-engagement";

type Tab = {
  id: string;
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (path: string) => boolean;
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t, localePath, isRtl } = useLanguage();
  const { isAuthenticated } = useAuth();

  const isHostArea =
    pathname.includes("/host/dashboard") ||
    pathname.includes("/host/listings");

  useEffect(() => {
    trackPwaPageView(pathname);
  }, [pathname]);

  const guestTabs: Tab[] = useMemo(
    () => [
      {
        id: "explore",
        href: localePath("/listings"),
        labelKey: "pwa.navExplore",
        icon: Compass,
        match: (p) => p.includes("/listings") && !p.includes("/host/"),
      },
      {
        id: "wishlist",
        href: localePath("/saved-listings"),
        labelKey: "pwa.navWishlist",
        icon: Heart,
        match: (p) => p.includes("/saved-listings"),
      },
      {
        id: "trips",
        href: localePath("/my-bookings"),
        labelKey: "pwa.navTrips",
        icon: Briefcase,
        match: (p) => p.includes("/my-bookings") || p.includes("/bookings/"),
      },
      {
        id: "profile",
        href: localePath(isAuthenticated ? "/profile" : "/login"),
        labelKey: "pwa.navProfile",
        icon: User,
        match: (p) => p.includes("/profile") || p.includes("/login"),
      },
    ],
    [localePath, isAuthenticated],
  );

  const hostTabs: Tab[] = useMemo(
    () => [
      {
        id: "dashboard",
        href: localePath("/host/dashboard"),
        labelKey: "pwa.navDashboard",
        icon: LayoutDashboard,
        match: (p) =>
          p.includes("/host/dashboard") &&
          !p.includes("#"),
      },
      {
        id: "bookings",
        href: `${localePath("/host/dashboard")}#host-bookings`,
        labelKey: "pwa.navBookings",
        icon: CalendarCheck,
        match: () => false,
      },
      {
        id: "listings",
        href: `${localePath("/host/dashboard")}#host-listings`,
        labelKey: "pwa.navListings",
        icon: Building2,
        match: (p) => p.includes("/host/listings"),
      },
      {
        id: "profile",
        href: localePath("/profile"),
        labelKey: "pwa.navProfile",
        icon: User,
        match: (p) => p.includes("/profile"),
      },
    ],
    [localePath],
  );

  const tabs = isHostArea ? hostTabs : guestTabs;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 md:hidden",
        "border-t border-nexa-line bg-[rgba(253,251,252,0.96)] backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)]",
      )}
      dir={isRtl ? "rtl" : "ltr"}
      aria-label={t("pwa.navAria")}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);
          return (
            <li key={tab.id} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 text-[0.65rem] font-semibold",
                  active ? "text-nexa-primary" : "text-nexa-ink-4",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.25px]")} />
                <span className="truncate max-w-full">{t(tab.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
