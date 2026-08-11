"use client";

import React from "react";
import type { HostAnalyticsResponse } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import { sumHostAnalyticsProperties } from "@/lib/host-analytics";

type TranslateFn = (key: string) => string;

interface HostAnalyticsSummaryProps {
  payload: HostAnalyticsResponse;
  t: TranslateFn;
  locale: Locale;
}

export function HostAnalyticsSummary({
  payload,
  t,
  locale,
}: HostAnalyticsSummaryProps) {
  const totals = sumHostAnalyticsProperties(payload.properties);
  const currency = payload.currency;

  return (
    <section
      className="mb-6 rounded-2xl border border-nexa-line bg-white p-6 sm:p-8"
      aria-labelledby="host-analytics-summary-heading"
    >
      <h2
        id="host-analytics-summary-heading"
        className="text-lg font-semibold text-nexa-ink mb-1"
      >
        {t("hostAnalytics.summaryTitle")}
      </h2>
      <p className="text-sm text-nexa-ink-3 mb-5">
        {t("hostAnalytics.summaryDesc")
          .replace("{start}", payload.period.start)
          .replace("{end}", payload.period.end_exclusive)}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-nexa-line bg-nexa-bg-1 p-4">
          <p className="text-xs text-nexa-ink-3 mb-2">
            {t("hostAnalytics.netEarnings")}
          </p>
          <p className="text-xl font-bold text-nexa-ink tabular-nums">
            {formatHostCurrency(totals.net_host_earnings, currency, locale)}
          </p>
        </div>
        <div className="rounded-xl border border-nexa-line bg-nexa-bg-1 p-4">
          <p className="text-xs text-nexa-ink-3 mb-2">
            {t("hostAnalytics.grossRevenue")}
          </p>
          <p className="text-xl font-bold text-nexa-ink tabular-nums">
            {formatHostCurrency(totals.gross_revenue, currency, locale)}
          </p>
        </div>
        <div className="rounded-xl border border-nexa-line bg-nexa-bg-1 p-4">
          <p className="text-xs text-nexa-ink-3 mb-2">
            {t("hostAnalytics.bookingsTotal")}
          </p>
          <p className="text-xl font-bold text-nexa-ink tabular-nums">
            {totals.bookings_total}
          </p>
        </div>
        <div className="rounded-xl border border-nexa-line bg-nexa-bg-1 p-4">
          <p className="text-xs text-nexa-ink-3 mb-2">
            {t("hostAnalytics.bookedNights")}
          </p>
          <p className="text-xl font-bold text-nexa-ink tabular-nums">
            {totals.booked_nights}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-nexa-ink-4">
        {t("hostAnalytics.summaryFootnote")
          .replace("{count}", String(totals.properties))
          .replace("{timezone}", payload.timezone)}
      </p>
    </section>
  );
}
