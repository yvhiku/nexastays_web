"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { InboxBell } from "@/components/messaging/InboxBell";
import {
  PORTAL_TOP_SECONDARY,
  portalPathnameWithoutLocale,
} from "@/components/host/portal/portal-nav";

type Props = {
  onOpenDrawer: () => void;
};

export function HostPortalTopBar({ onOpenDrawer }: Props) {
  const { t, localePath } = useLanguage();
  const pathname = usePathname() || "";
  const path = portalPathnameWithoutLocale(pathname);

  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-[color:var(--host-border)] bg-[color:var(--host-background)] px-4 py-3 md:px-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-lg p-2 text-[color:var(--host-text-secondary)] hover:bg-[color:var(--host-primary-soft)] hover:text-[color:var(--host-primary)] md:hidden"
          onClick={onOpenDrawer}
          aria-label={t("hostPortal.openMenu")}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <h2 className="hidden text-lg font-extrabold text-[color:var(--host-text)] md:block">
          {t("hostPortal.title")}
        </h2>
        <nav
          className="ms-2 hidden items-center gap-5 lg:flex"
          aria-label={t("hostPortal.topNavAria")}
        >
          {PORTAL_TOP_SECONDARY.map((item) => {
            const active = item.match(path);
            return (
              <Link
                key={item.id}
                href={localePath(item.href)}
                className={cn(
                  "border-b-2 pb-0.5 text-sm font-medium transition-colors",
                  active
                    ? "border-[color:var(--host-primary)] text-[color:var(--host-primary)]"
                    : "border-transparent text-[color:var(--host-text-secondary)] hover:text-[color:var(--host-primary)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href={localePath("/stays")}
          className="hidden rounded-lg bg-[color:var(--host-primary-soft)] px-3 py-2 text-sm font-medium text-[color:var(--host-primary)] transition-colors hover:bg-[color:var(--host-border)] sm:inline-flex"
        >
          {t("hostPortal.switchToGuest")}
        </Link>
        <InboxBell className="text-[color:var(--host-text-secondary)] hover:text-[color:var(--host-primary)]" />
      </div>
    </header>
  );
}
