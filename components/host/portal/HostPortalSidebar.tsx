"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import {
  PORTAL_CTA,
  PORTAL_PRIMARY_NAV,
  PORTAL_SETTINGS_NAV,
  portalPathnameWithoutLocale,
} from "@/components/host/portal/portal-nav";

type Props = {
  onNavigate?: () => void;
  className?: string;
};

export function HostPortalSidebar({ onNavigate, className }: Props) {
  const { t, localePath } = useLanguage();
  const { user, token } = useAuth();
  const pathname = usePathname() || "";
  const path = portalPathnameWithoutLocale(pathname);
  const displayName = user?.full_name?.trim() || t("hostPortal.profileFallback");
  const hasPhoto = Boolean(user?.profile_photo_url);

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-e border-[color:var(--host-border)] bg-[color:var(--host-surface)] py-6 shadow-sm",
        className,
      )}
    >
      <div className="mb-8 px-6">
        <p className="text-xl font-bold text-[color:var(--host-primary)]">
          {t("hostPortal.brand")}
        </p>
        <p className="text-sm text-[color:var(--host-text-secondary)]">
          {t("hostPortal.tagline")}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2" aria-label={t("hostPortal.navAria")}>
        {PORTAL_PRIMARY_NAV.map((item) => {
          const active = item.match(path);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={localePath(item.href)}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "host-portal-nav-active rounded-s-none"
                  : "text-[color:var(--host-text-secondary)] hover:bg-[color:var(--host-primary-soft)]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 pt-4">
        <Link
          href={localePath(PORTAL_CTA.href)}
          onClick={onNavigate}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--host-primary)] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <PORTAL_CTA.icon className="h-4 w-4" aria-hidden />
          {t(PORTAL_CTA.labelKey)}
        </Link>

        <Link
          href={localePath(PORTAL_SETTINGS_NAV.href)}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
            PORTAL_SETTINGS_NAV.match(path)
              ? "host-portal-nav-active rounded-s-none"
              : "text-[color:var(--host-text-secondary)] hover:bg-[color:var(--host-primary-soft)]",
          )}
        >
          <PORTAL_SETTINGS_NAV.icon className="h-5 w-5" aria-hidden />
          {t(PORTAL_SETTINGS_NAV.labelKey)}
        </Link>

        <div className="mt-4 flex items-center gap-3 border-t border-[color:var(--host-border)] px-2 pt-4">
          <ProfileAvatar
            hasPhoto={hasPhoto}
            token={token}
            userId={user?.id}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[color:var(--host-text)]">
              {displayName}
            </p>
            <p className="truncate text-xs text-[color:var(--host-text-secondary)]">
              {t("hostPortal.hostLabel")}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
