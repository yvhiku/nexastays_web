"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { HostPortalSidebar } from "@/components/host/portal/HostPortalSidebar";
import {
  PORTAL_MOBILE_BOTTOM_NAV,
  portalPathnameWithoutLocale,
} from "@/components/host/portal/portal-nav";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function HostPortalMobileDrawer({ open, onClose }: DrawerProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t("hostPortal.navAria")}>
      <button
        type="button"
        className="host-portal-drawer-backdrop absolute inset-0"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div className="absolute inset-y-0 start-0 w-64 max-w-[85vw] shadow-xl">
        <HostPortalSidebar onNavigate={onClose} className="h-full" />
      </div>
    </div>
  );
}

export function HostPortalMobileBottomNav() {
  const { t, localePath } = useLanguage();
  const pathname = usePathname() || "";
  const path = portalPathnameWithoutLocale(pathname);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--host-border)] bg-[color:var(--host-surface)] pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label={t("hostPortal.mobileNavAria")}
    >
      <ul className="flex items-stretch justify-around px-1 py-1">
        {PORTAL_MOBILE_BOTTOM_NAV.map((item) => {
          const active = item.match(path);
          const Icon = item.icon;
          return (
            <li key={item.id} className="flex-1">
              <Link
                href={localePath(item.href)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium",
                  active
                    ? "text-[color:var(--host-primary)]"
                    : "text-[color:var(--host-text-secondary)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
