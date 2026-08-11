"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HostDashboardAggregate } from "@/lib/stays-types";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import type { Locale } from "@/lib/i18n";

type TranslateFn = (key: string) => string;

interface HostDashboardHeroProps {
  dashboard: HostDashboardAggregate | null;
  loading?: boolean;
  t: TranslateFn;
  locale: Locale;
}

export function HostDashboardHero({
  dashboard,
  loading,
  t,
  locale,
}: HostDashboardHeroProps) {
  if (loading && !dashboard) {
    return (
      <section
        className="mb-6 rounded-2xl border border-nexa-line bg-white p-6 sm:p-8 animate-pulse"
        aria-busy="true"
      >
        <div className="h-4 w-24 bg-nexa-bg-2 rounded mb-3" />
        <div className="h-10 w-48 bg-nexa-bg-2 rounded mb-4" />
        <div className="h-4 w-64 bg-nexa-bg-2 rounded" />
      </section>
    );
  }

  if (!dashboard) return null;

  const net = dashboard.earnings.this_month.net_host_earnings;
  const mom = dashboard.earnings.this_month.mom_pct;
  const currency = dashboard.currency;
  const gross = dashboard.earnings.this_month.gross_revenue;
  const fees = dashboard.earnings.this_month.platform_fees;

  let momKind: "up" | "down" | "flat" | null = null;
  let momLabel: string | null = null;
  if (mom != null && !Number.isNaN(mom)) {
    if (mom === 0) {
      momKind = "flat";
      momLabel = t("hostDashboard.momFlat");
    } else if (mom > 0) {
      momKind = "up";
      momLabel = t("hostDashboard.momUp").replace("{pct}", Math.abs(mom).toFixed(1));
    } else {
      momKind = "down";
      momLabel = t("hostDashboard.momDown").replace(
        "{pct}",
        Math.abs(mom).toFixed(1),
      );
    }
  }

  return (
    <section
      className="mb-6 rounded-2xl border border-nexa-line bg-white p-6 sm:p-8"
      aria-labelledby="host-month-earnings-heading"
    >
      <p
        id="host-month-earnings-heading"
        className="text-sm font-medium text-nexa-ink-3 uppercase tracking-wide"
      >
        {t("hostDashboard.thisMonth")}
      </p>
      <p className="mt-1 text-sm text-nexa-ink-4">
        {t("hostDashboard.netEarningsLabel")}
      </p>
      <p className="mt-2 text-3xl sm:text-4xl font-bold text-nexa-ink tracking-tight">
        {formatHostCurrency(net, currency, locale)}
      </p>

      {momLabel && momKind ? (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1.5 text-sm font-medium",
            momKind === "up" && "text-green-700",
            momKind === "down" && "text-red-700",
            momKind === "flat" && "text-nexa-ink-3",
          )}
        >
          {momKind === "up" ? (
            <TrendingUp className="h-4 w-4" aria-hidden />
          ) : momKind === "down" ? (
            <TrendingDown className="h-4 w-4" aria-hidden />
          ) : (
            <Minus className="h-4 w-4" aria-hidden />
          )}
          <span>{momLabel}</span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-nexa-ink-4">
          {t("hostDashboard.momUnavailable")}
        </p>
      )}

      <div className="mt-5 pt-5 border-t border-nexa-line grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-nexa-ink-4">{t("hostDashboard.grossRevenueThisMonth")}</p>
          <p className="font-medium text-nexa-ink mt-0.5">
            {formatHostCurrency(gross, currency, locale)}
          </p>
        </div>
        <div>
          <p className="text-nexa-ink-4">{t("hostDashboard.platformFeesThisMonth")}</p>
          <p className="font-medium text-nexa-ink mt-0.5">
            {formatHostCurrency(fees, currency, locale)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-nexa-ink-4">
        {t("hostDashboard.timezoneHint").replace(
          "{timezone}",
          dashboard.timezone,
        )}
      </p>
    </section>
  );
}
