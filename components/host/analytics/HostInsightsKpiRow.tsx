"use client";

import React from "react";
import { Banknote, CalendarDays, Moon, Wallet } from "lucide-react";
import type { HostAnalyticsResponse } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import { sumHostAnalyticsProperties } from "@/lib/host-analytics";
import { HostPortalStatCard } from "@/components/host/portal/HostPortalStatCard";

type TranslateFn = (key: string) => string;

type Props = {
  payload: HostAnalyticsResponse;
  t: TranslateFn;
  locale: Locale;
};

/**
 * Portfolio KPI row — sums only via sumHostAnalyticsProperties.
 * Never averages occupancy.
 */
export function HostInsightsKpiRow({ payload, t, locale }: Props) {
  const totals = sumHostAnalyticsProperties(payload.properties);
  const currency = payload.currency;

  return (
    <section className="mb-6" aria-labelledby="host-insights-kpi-heading">
      <div className="mb-4">
        <h2
          id="host-insights-kpi-heading"
          className="text-lg font-semibold text-[color:var(--host-text)]"
        >
          {t("hostAnalytics.summaryTitle")}
        </h2>
        <p className="mt-1 text-sm text-[color:var(--host-text-secondary)]">
          {t("hostAnalytics.summaryDesc")
            .replace("{start}", payload.period.start)
            .replace("{end}", payload.period.end_exclusive)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HostPortalStatCard
          label={t("hostAnalytics.netEarnings")}
          value={formatHostCurrency(
            totals.net_host_earnings,
            currency,
            locale,
          )}
          icon={Banknote}
          supportingText={t("hostPortal.analytics.kpiNetHint")}
        />
        <HostPortalStatCard
          label={t("hostAnalytics.grossRevenue")}
          value={formatHostCurrency(totals.gross_revenue, currency, locale)}
          icon={Wallet}
        />
        <HostPortalStatCard
          label={t("hostAnalytics.bookingsTotal")}
          value={String(totals.bookings_total)}
          icon={CalendarDays}
        />
        <HostPortalStatCard
          label={t("hostAnalytics.bookedNights")}
          value={String(totals.booked_nights)}
          icon={Moon}
        />
      </div>

      <p className="mt-3 text-xs text-[color:var(--host-muted)]">
        {t("hostAnalytics.summaryFootnote")
          .replace("{count}", String(totals.properties))
          .replace("{timezone}", payload.timezone)}
      </p>
    </section>
  );
}
