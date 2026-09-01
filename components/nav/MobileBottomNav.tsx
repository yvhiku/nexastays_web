"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Bookmark,
  Search,
  Map,
  List,
  Luggage,
  User,
  LayoutDashboard,
  CalendarCheck,
  Building2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileSearch } from "@/components/search/MobileSearchProvider";
import { cn } from "@/lib/utils";
import { isMessagingThreadPath } from "@/lib/messaging/thread-routes";
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
  const router = useRouter();
  const { t, localePath, isRtl } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { openSearch } = useMobileSearch();
  const [fabGlow, setFabGlow] = useState(false);
  const [exploreMode, setExploreMode] = useState<"list" | "map">("list");

  const isHostArea =
    pathname.includes("/host/dashboard") ||
    pathname.includes("/host/bookings") ||
    pathname.includes("/host/listings") ||
    pathname.includes("/host/reviews") ||
    pathname.includes("/host/analytics");
  const barePath = pathname.replace(/^\/(en|fr|ar)/, "") || "/";
  const isExploreScreen = barePath === "/listings";

  useEffect(() => {
    if (!isExploreScreen) {
      setExploreMode("list");
      return;
    }
    const syncFromUrl = () => {
      const layout = new URLSearchParams(window.location.search).get("layout");
      setExploreMode(layout === "map" ? "map" : "list");
    };
    const syncFromExplore = (event: Event) => {
      const mode = (event as CustomEvent<{ mode?: string }>).detail?.mode;
      if (mode === "map" || mode === "list") setExploreMode(mode);
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("nexa:explore-mode", syncFromExplore);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("nexa:explore-mode", syncFromExplore);
    };
  }, [isExploreScreen, pathname]);

  useEffect(() => {
    trackPwaPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    const sync = () =>
      setFabGlow(document.documentElement.dataset.guidanceFabGlow === "1");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-guidance-fab-glow"],
    });
    return () => obs.disconnect();
  }, []);

  const guestSideTabs: Tab[] = useMemo(
    () => [
      {
        id: "explore",
        href: localePath("/listings"),
        labelKey: "pwa.navExplore",
        icon: Compass,
        match: (p) => {
          const bare = p.replace(/^\/(en|fr|ar)/, "") || "/";
          return bare === "/listings" || bare.startsWith("/listings");
        },
      },
      {
        id: "saved",
        href: localePath("/saved-listings"),
        labelKey: "pwa.navSaved",
        icon: Bookmark,
        match: (p) => p.includes("/saved-listings"),
      },
      {
        id: "trips",
        href: localePath("/my-bookings"),
        labelKey: "pwa.navTrips",
        icon: Luggage,
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
        match: (p) => p.includes("/host/dashboard"),
      },
      {
        id: "bookings",
        href: localePath("/host/bookings"),
        labelKey: "pwa.navBookings",
        icon: CalendarCheck,
        match: (p) => p.includes("/host/bookings"),
      },
      {
        id: "listings",
        href: localePath("/host/listings"),
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

  if (isMessagingThreadPath(pathname)) {
    return null;
  }

  if (barePath === "/host") {
    return null;
  }

  if (isHostArea) {
    return (
      <nav
        className="fixed inset-x-0 bottom-0 z-layer-header px-3 md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        dir={isRtl ? "rtl" : "ltr"}
        aria-label={t("pwa.navAria")}
      >
        <div
          className={cn(
            "mx-auto flex max-w-lg items-stretch justify-between gap-0.5 rounded-[28px] px-1.5 py-1.5",
            "border border-white/40 bg-white/90 shadow-[0_8px_40px_rgba(26,17,24,0.14)] backdrop-blur-2xl",
          )}
        >
          {hostTabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[0.7rem] font-medium transition-all duration-200 active:scale-95",
                  active ? "scale-105 font-semibold text-nexa-primary" : "text-nexa-ink-4",
                )}
              >
                <Icon className={cn("h-[22px] w-[22px]", active && "stroke-[2.25px]")} />
                <span className="truncate max-w-full">{t(tab.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  const left = guestSideTabs.slice(0, 2);
  const right = guestSideTabs.slice(2);
  const FabIcon = !isExploreScreen
    ? Search
    : exploreMode === "list"
      ? Map
      : List;
  const fabLabel = !isExploreScreen
    ? t("pwa.navSearch")
    : exploreMode === "list"
      ? t("pwa.navMap")
      : t("pwa.navList");

  const handleFab = () => {
    if (!isExploreScreen) {
      openSearch();
      return;
    }

    const nextMode = exploreMode === "list" ? "map" : "list";
    const next = new URLSearchParams(window.location.search);
    next.set("layout", nextMode);
    setExploreMode(nextMode);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-layer-header px-3 md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      dir={isRtl ? "rtl" : "ltr"}
      aria-label={t("pwa.navAria")}
    >
      <div className="relative mx-auto max-w-lg">
        <div
          className={cn(
            "flex items-stretch justify-between gap-0.5 rounded-[28px] px-1.5 py-1.5",
            "border border-white/40 bg-white/90 shadow-[0_8px_40px_rgba(26,17,24,0.14)] backdrop-blur-2xl",
          )}
        >
          {left.map((tab) => {
            const Icon = tab.icon;
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[0.7rem] font-medium transition-all duration-200 active:scale-95",
                  active ? "scale-105 font-semibold text-nexa-primary" : "text-nexa-ink-4",
                )}
              >
                <span
                  data-guidance-target={tab.id === "saved" ? "nav-saved" : undefined}
                  className="inline-flex flex-col items-center justify-center gap-0.5"
                >
                  <Icon className={cn("h-[22px] w-[22px]", active && "stroke-[2.25px]")} />
                  <span className="truncate max-w-full">{t(tab.labelKey)}</span>
                </span>
              </Link>
            );
          })}

          {/* Spacer for FAB */}
          <div className="w-16 shrink-0" aria-hidden />

          {right.map((tab) => {
            const Icon = tab.icon;
            const active = tab.match(pathname);
            const guidanceTarget =
              tab.id === "trips" ? "nav-trips" : tab.id === "saved" ? "nav-saved" : undefined;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[0.7rem] font-medium transition-all duration-200 active:scale-95",
                  active ? "scale-105 font-semibold text-nexa-primary" : "text-nexa-ink-4",
                )}
              >
                <span
                  data-guidance-target={guidanceTarget}
                  className="inline-flex flex-col items-center justify-center gap-0.5"
                >
                  <Icon className={cn("h-[22px] w-[22px]", active && "stroke-[2.25px]")} />
                  <span className="truncate max-w-full">{t(tab.labelKey)}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleFab}
          data-guidance-target="search-fab"
          data-nexa-search-fab=""
          aria-label={fabLabel}
          className={cn(
            "absolute left-1/2 top-0 z-layer-content flex h-14 w-14 -translate-x-1/2 -translate-y-[18px] items-center justify-center",
            "rounded-full text-white shadow-[0_8px_24px_rgba(232,80,122,0.45)]",
            "bg-gradient-to-br from-[#FF5A7D] to-[#FF7D9D]",
            "transition-transform duration-200 active:scale-110",
            "motion-reduce:animate-none motion-reduce:scale-100",
            fabGlow && "scale-110 ring-4 ring-[#E8507A]/50 animate-pulse",
          )}
        >
          <span
            key={`${isExploreScreen ? "explore" : "search"}-${exploreMode}`}
            className="animate-[nexaFabMorph_180ms_ease-out] motion-reduce:animate-none"
          >
            <FabIcon className="h-6 w-6" strokeWidth={2.25} />
          </span>
        </button>
      </div>
    </nav>
  );
}
