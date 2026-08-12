"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Home,
  Star,
} from "lucide-react";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";

type TranslateFn = (key: string) => string;

type Props = {
  t: TranslateFn;
  localePath: (path: string) => string;
};

const LINKS = [
  {
    href: "/host/dashboard",
    labelKey: "hostPortal.analytics.linkDashboard",
    icon: Home,
  },
  {
    href: "/host/bookings",
    labelKey: "hostPortal.analytics.linkBookings",
    icon: CalendarDays,
  },
  {
    href: "/host/listings",
    labelKey: "hostPortal.analytics.linkListings",
    icon: Building2,
  },
  {
    href: "/host/reviews",
    labelKey: "hostPortal.analytics.linkReviews",
    icon: Star,
  },
] as const;

export function HostInsightsQuickLinks({ t, localePath }: Props) {
  return (
    <HostPortalCard className="mb-4 p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[color:var(--host-text)]">
        <BarChart3
          className="h-5 w-5 text-[color:var(--host-primary)]"
          aria-hidden
        />
        {t("hostPortal.analytics.quickLinksTitle")}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={localePath(item.href)}
              className="flex flex-col items-center gap-2 rounded-lg border border-[color:var(--host-primary-border)] bg-[color:var(--host-surface)] px-3 py-4 text-center text-sm font-medium text-[color:var(--host-text)] transition-colors hover:border-[color:var(--host-primary)] hover:bg-[color:var(--host-primary-soft)]"
            >
              <Icon
                className="h-5 w-5 text-[color:var(--host-primary)]"
                aria-hidden
              />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </HostPortalCard>
  );
}
