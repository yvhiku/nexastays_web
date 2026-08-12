"use client";

import React from "react";
import type { HostAnalyticsResponse } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import type { HostAnalyticsPeriodId } from "@/lib/stays-types";
import { isHostAnalyticsEmpty } from "@/lib/host-analytics";
import { HostInsightsHeader } from "@/components/host/analytics/HostInsightsHeader";
import { HostInsightsKpiRow } from "@/components/host/analytics/HostInsightsKpiRow";
import { HostInsightsProperties } from "@/components/host/analytics/HostInsightsProperties";
import { HostInsightsEmptyState } from "@/components/host/analytics/HostInsightsEmptyState";
import { HostInsightsSkeleton } from "@/components/host/analytics/HostInsightsSkeleton";
import { HostInsightsQuickLinks } from "@/components/host/analytics/HostInsightsQuickLinks";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { Button } from "@/components/ui/button";

type TranslateFn = (key: string) => string;

export type HostInsightsPageProps = {
  payload: HostAnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  period: HostAnalyticsPeriodId;
  onPeriodChange: (period: HostAnalyticsPeriodId) => void;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
};

/**
 * Presentation composer for Host Insights.
 * Domain fetch/gate/period URL stay in page.tsx.
 * Property order defaults to API order; optional client sort in HostInsightsProperties.
 */
export function HostInsightsPage({
  payload,
  loading,
  error,
  onRetry,
  period,
  onPeriodChange,
  t,
  locale,
  localePath,
}: HostInsightsPageProps) {
  const empty = payload != null && !error && isHostAnalyticsEmpty(payload);

  return (
    <div className="pb-4">
      <HostInsightsHeader
        t={t}
        period={period}
        onPeriodChange={onPeriodChange}
        periodDisabled={loading && !payload}
        asOf={payload?.as_of ?? null}
        timezone={payload?.timezone ?? null}
      />

      {error ? (
        <HostPortalCard className="mb-6 border-red-100 bg-red-50 px-4 py-5 text-sm text-red-900">
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onRetry}
          >
            {t("hostAnalytics.retry")}
          </Button>
        </HostPortalCard>
      ) : null}

      {!error && loading && !payload ? <HostInsightsSkeleton /> : null}

      {!error && payload ? (
        <>
          <HostInsightsKpiRow payload={payload} t={t} locale={locale} />

          <p className="mb-4 text-xs text-[color:var(--host-muted)]">
            {t("hostAnalytics.occupancyFootnote")}
          </p>

          {empty ? (
            <HostInsightsEmptyState t={t} localePath={localePath} />
          ) : (
            <HostInsightsProperties
              properties={payload.properties}
              currency={payload.currency}
              locale={locale}
              localePath={localePath}
              t={t}
            />
          )}
        </>
      ) : null}

      {loading && payload ? (
        <p
          className="mt-4 text-center text-sm text-[color:var(--host-muted)]"
          aria-live="polite"
        >
          {t("hostAnalytics.loading")}
        </p>
      ) : null}

      <HostInsightsQuickLinks t={t} localePath={localePath} />
    </div>
  );
}
