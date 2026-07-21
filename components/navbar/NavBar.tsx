"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { LanguagePill } from "@/components/mobile/LanguagePill";
import { NotificationBell } from "@/components/mobile/NotificationBell";
import { InboxBell } from "@/components/messaging/InboxBell";
import { ChevronDown, User, LogOut, Menu, X, LayoutDashboard, CalendarCheck, Bookmark } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useHeaderState } from "@/components/navbar/HeaderStateProvider.client";

const navLinks = [
  { href: "/listings", labelKey: "nav.stays", id: "listings" },
  { href: "/host", labelKey: "nav.becomeHost", id: "host" },
  { href: "/#how", labelKey: "nav.howItWorks", id: "how" },
  { href: "/safety-transparency", labelKey: "nav.safetyTransparency", id: "safety" },
  { href: "/about", labelKey: "nav.about", id: "about" },
];

export const NavBar = () => {
  const pathname = usePathname();
  const { t, localePath, isRtl } = useLanguage();
  const { isAuthenticated, user, token, tokenType, logout } = useAuth();
  const { hostMode, pollingActive } = useHeaderState();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showBecomeHostLink = pollingActive ? !hostMode : true;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string, id: string) => {
    if (href === "/" || href.startsWith("/#")) {
      return pathname.match(/^\/[a-z]{2}\/?$/) != null && id === "how";
    }
    const fullHref = localePath(href);

    // Host application only — not dashboard or listing wizard (/host/dashboard, /host/listings/…)
    if (id === "host") {
      return pathname === fullHref;
    }

    if (id === "hostDashboard") {
      const dashboardHref = localePath("/host/dashboard");
      const listingsHref = localePath("/host/listings");
      return (
        pathname === dashboardHref ||
        pathname.startsWith(`${dashboardHref}/`) ||
        pathname === listingsHref ||
        pathname.startsWith(`${listingsHref}/`)
      );
    }

    if (id === "inbox") {
      const inboxHref = localePath("/inbox");
      return pathname === inboxHref || pathname.startsWith(`${inboxHref}/`);
    }

    return pathname === fullHref || pathname.startsWith(`${fullHref}/`);
  };

  const visibleNavLinks = isAuthenticated
    ? [
        navLinks[0],
        { href: "/inbox", labelKey: "inbox.title", id: "inbox" as const },
        { href: "/host/dashboard", labelKey: "nav.hostDashboard", id: "hostDashboard" as const },
        ...navLinks.slice(2),
      ]
    : navLinks;

  return (
    <>
      <nav className="fixed inset-x-0 z-50 top-[var(--nexa-app-banner-h,0px)] h-[calc(72px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-[rgba(253,251,252,0.92)] backdrop-blur-xl border-b border-nexa-line flex items-center overflow-x-clip nexa-top-nav">
      <div className="w-full max-w-[1280px] mx-auto ps-4 pe-2 sm:ps-6 sm:pe-3 md:px-8 flex items-center justify-between gap-2 sm:gap-4 md:gap-6 min-w-0">
        <Link
          href={localePath("/")}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer hover:opacity-90 transition-opacity shrink-0 min-w-0"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border-2 border-nexa-primary-soft shrink-0">
            <Image
              src={NEXA_STAYS_LOGO_SRC}
              alt="Nexa Stays"
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
          <span className="font-display text-lg sm:text-xl font-bold text-nexa-ink truncate">
            Nexa <span className="text-nexa-primary">Stays</span>
          </span>
        </Link>

        <div className="hidden xl:flex flex-1 items-center justify-center gap-4 2xl:gap-7 min-w-0 overflow-hidden">
          {visibleNavLinks.map(({ href, labelKey, id }) => (
            <Link
              key={id}
              href={href.startsWith("/#") ? localePath("/") + href.slice(1) : localePath(href)}
              className={cn(
                "text-sm font-medium py-1 border-b-2 border-transparent transition-colors whitespace-nowrap shrink-0",
                isActive(href, id)
                  ? "text-nexa-primary border-nexa-primary"
                  : "text-nexa-ink-3 hover:text-nexa-primary"
              )}
            >
              {t(labelKey)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <LanguagePill />
          <div className="hidden xl:block">
            <LanguageSelector />
          </div>
          <InboxBell />
          <NotificationBell />
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-nexa-bg-2 transition-colors text-nexa-ink"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <ProfileAvatar
                  hasPhoto={!!(user?.profile_photo_url && String(user.profile_photo_url).trim().length > 0)}
                  token={tokenType === "jwt" ? token : null}
                  size="sm"
                />
                <span className="text-sm font-medium hidden md:inline">{t("common.profile")}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform hidden md:inline", profileOpen && "rotate-180")} />
              </button>
              {profileOpen && (
                <div className="absolute end-0 top-full mt-2 w-52 py-1 bg-white rounded-lg shadow-lg border border-nexa-line z-50">
                  <Link
                    href={localePath("/profile")}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-nexa-ink hover:bg-nexa-bg-2"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    {t("common.profile")}
                  </Link>
                  <Link
                    href={localePath("/my-bookings")}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-nexa-ink hover:bg-nexa-bg-2"
                    onClick={() => setProfileOpen(false)}
                  >
                    <CalendarCheck className="h-4 w-4 shrink-0" />
                    {t("nav.myBookings")}
                  </Link>
                  <Link
                    href={localePath("/saved-listings")}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-nexa-ink hover:bg-nexa-bg-2"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Bookmark className="h-4 w-4 shrink-0" />
                    {t("nav.savedListings")}
                  </Link>
                  <Link
                    href={localePath("/host/dashboard")}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-nexa-ink hover:bg-nexa-bg-2"
                    onClick={() => setProfileOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t("nav.hostDashboard")}
                  </Link>
                  {showBecomeHostLink && (
                    <Link
                      href={localePath("/host")}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-nexa-ink hover:bg-nexa-bg-2"
                      onClick={() => setProfileOpen(false)}
                    >
                      {t("nav.becomeHost")}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-nexa-ink hover:bg-nexa-bg-2 text-start"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("common.signOut")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button variant="default" size="sm" className="min-h-[44px] sm:min-h-0" asChild>
              <Link href={localePath("/login")}>{t("common.signIn")}</Link>
            </Button>
          )}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="hidden md:flex xl:hidden items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg hover:bg-nexa-bg-2 text-nexa-ink transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>

      {/* Mobile / tablet menu overlay */}
    <div
      className={cn(
        "fixed inset-0 z-[1100] hidden md:block xl:hidden transition-opacity duration-300",
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      aria-hidden={!mobileMenuOpen}
    >
      <div
        className="absolute inset-0 bg-nexa-ink/40 backdrop-blur-sm"
        onClick={() => setMobileMenuOpen(false)}
      />
      <div
        className={cn(
          "absolute top-0 end-0 w-full max-w-[320px] h-full bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-nexa-line">
          <span className="font-display text-lg font-bold text-nexa-ink">{t("common.menu")}</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg hover:bg-nexa-bg-2 text-nexa-ink"
            aria-label={isRtl ? "إغلاق القائمة" : "Close menu"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col p-4 gap-1 overflow-y-auto">
          {visibleNavLinks.map(({ href, labelKey, id }) => (
            <Link
              key={id}
              href={href.startsWith("/#") ? localePath("/") + href.slice(1) : localePath(href)}
              className={cn(
                "px-4 py-3 min-h-[44px] flex items-center rounded-xl text-base font-medium transition-colors",
                isActive(href, id) ? "text-nexa-primary bg-nexa-primary-soft" : "text-nexa-ink hover:bg-nexa-bg-2"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(labelKey)}
            </Link>
          ))}
          <div className="mt-2 px-4 py-2">
            <LanguageSelector />
          </div>
          <div className="mt-4 pt-4 border-t border-nexa-line">
            {isAuthenticated ? (
              <>
                <Link
                  href={localePath("/profile")}
                  className="flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-nexa-ink hover:bg-nexa-bg-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  {t("common.profile")}
                </Link>
                <Link
                  href={localePath("/my-bookings")}
                  className="flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-nexa-ink hover:bg-nexa-bg-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <CalendarCheck className="h-4 w-4 shrink-0" />
                  {t("nav.myBookings")}
                </Link>
                <Link
                  href={localePath("/saved-listings")}
                  className="flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-nexa-ink hover:bg-nexa-bg-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Bookmark className="h-4 w-4 shrink-0" />
                  {t("nav.savedListings")}
                </Link>
                <Link
                  href={localePath("/host/dashboard")}
                  className="flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-nexa-ink hover:bg-nexa-bg-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("nav.hostDashboard")}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 min-h-[44px] rounded-xl text-nexa-ink hover:bg-nexa-bg-2 text-start"
                >
                  <LogOut className="h-4 w-4" />
                  {t("common.signOut")}
                </button>
              </>
            ) : (
              <Link
                href={localePath("/login")}
                className="flex items-center justify-center px-4 py-3 min-h-[44px] rounded-xl bg-nexa-primary text-white font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("common.signIn")}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
    </>
  );
};
