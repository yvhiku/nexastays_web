"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLoader } from "@/components/AppLoader";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getHostAnalytics,
  getHostVerification,
  normalizeHostVerificationStatus,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import type {
  HostAnalyticsPeriodId,
  HostAnalyticsResponse,
  HostVerificationStatus,
} from "@/lib/stays-types";
import {
  HOST_ANALYTICS_DEFAULT_PERIOD,
  isHostAnalyticsEmpty,
  parseHostAnalyticsPeriod,
} from "@/lib/host-analytics";
import { HostAnalyticsPeriodSelector } from "@/components/host/HostAnalyticsPeriodSelector";
import { HostAnalyticsSummary } from "@/components/host/HostAnalyticsSummary";
import { HostAnalyticsPropertyTable } from "@/components/host/HostAnalyticsPropertyTable";
import { HostAnalyticsPropertyCard } from "@/components/host/HostAnalyticsPropertyCard";

function HostAnalyticsContent() {
  const { token } = useAuth();
  const { t, locale, localePath } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const periodFromUrl = parseHostAnalyticsPeriod(searchParams.get("period"));
  const [period, setPeriod] = useState<HostAnalyticsPeriodId>(periodFromUrl);

  const [hostStatus, setHostStatus] = useState<HostVerificationStatus | null>(
    null,
  );
  const [gateLoading, setGateLoading] = useState(true);
  const [gateError, setGateError] = useState<string | null>(null);

  const [payload, setPayload] = useState<HostAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPeriod(periodFromUrl);
  }, [periodFromUrl]);

  useEffect(() => {
    if (!token) return;
    setGateLoading(true);
    setGateError(null);
    getHostVerification(token)
      .then((s) => setHostStatus(normalizeHostVerificationStatus(s)))
      .catch((e) =>
        setGateError(formatUserError(e) || t("hostAnalytics.failedLoad")),
      )
      .finally(() => setGateLoading(false));
  }, [token, t]);

  const loadAnalytics = useCallback(
    async (periodId: HostAnalyticsPeriodId) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getHostAnalytics(token, { period: periodId });
        setPayload(res);
      } catch (e) {
        setPayload(null);
        setError(formatUserError(e) || t("hostAnalytics.failedLoad"));
      } finally {
        setLoading(false);
      }
    },
    [token, t],
  );

  const approved = (hostStatus?.status ?? "") === "APPROVED";

  useEffect(() => {
    if (!token || !approved) return;
    void loadAnalytics(period);
  }, [token, approved, period, loadAnalytics]);

  const onPeriodChange = useCallback(
    (next: HostAnalyticsPeriodId) => {
      setPeriod(next);
      const path =
        next === HOST_ANALYTICS_DEFAULT_PERIOD
          ? localePath("/host/analytics")
          : localePath(`/host/analytics?period=${next}`);
      router.replace(path, { scroll: false });
    },
    [localePath, router],
  );

  const empty = useMemo(
    () => payload != null && !error && isHostAnalyticsEmpty(payload),
    [payload, error],
  );

  if (gateLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (gateError) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <p className="text-nexa-ink-3 mb-6">{gateError}</p>
        <Button asChild>
          <Link href={localePath("/host/dashboard")}>
            {t("hostAnalytics.backToDashboard")}
          </Link>
        </Button>
      </div>
    );
  }

  if (!approved) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <p className="text-nexa-ink-3 mb-6">{t("hostAnalytics.notApproved")}</p>
        <Button asChild>
          <Link href={localePath("/host/dashboard")}>
            {t("hostAnalytics.backToDashboard")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ms-2">
          <Link
            href={localePath("/host/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            {t("hostAnalytics.backToDashboard")}
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-nexa-ink">
              {t("hostAnalytics.title")}
            </h1>
            <p className="text-nexa-ink-3 mt-1">
              {t("hostAnalytics.description")}
            </p>
          </div>
          <HostAnalyticsPeriodSelector
            value={period}
            onChange={onPeriodChange}
            disabled={loading && !payload}
            t={t}
          />
        </div>
      </div>

      {error ? (
        <div className="mb-6 space-y-3">
          <ErrorAlert error={error} onDismiss={() => setError(null)} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadAnalytics(period)}
          >
            {t("hostAnalytics.retry")}
          </Button>
        </div>
      ) : null}

      {!error && loading && !payload ? (
        <div className="space-y-4" aria-busy="true">
          <div className="h-40 rounded-2xl border border-nexa-line bg-white animate-pulse" />
          <div className="h-64 rounded-2xl border border-nexa-line bg-white animate-pulse" />
        </div>
      ) : null}

      {!error && payload ? (
        <>
          <HostAnalyticsSummary payload={payload} t={t} locale={locale} />

          <p className="text-xs text-nexa-ink-4 mb-4">
            {t("hostAnalytics.occupancyFootnote")}
          </p>

          {empty ? (
            <section className="rounded-2xl border border-nexa-line bg-white p-8 text-center">
              <h2 className="text-lg font-semibold text-nexa-ink mb-2">
                {t("hostAnalytics.emptyTitle")}
              </h2>
              <p className="text-sm text-nexa-ink-3 mb-4">
                {t("hostAnalytics.emptyDesc")}
              </p>
              <Button asChild>
                <Link href={localePath("/host/listings/new")}>
                  {t("hostAnalytics.addListing")}
                </Link>
              </Button>
            </section>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-nexa-ink">
                  {t("hostAnalytics.propertiesTitle")}
                </h2>
                <Link
                  href={localePath("/host/reviews")}
                  className="text-sm font-medium text-nexa-primary hover:underline"
                >
                  {t("hostAnalytics.viewReviews")}
                </Link>
              </div>

              <HostAnalyticsPropertyTable
                properties={payload.properties}
                currency={payload.currency}
                locale={locale}
                localePath={localePath}
                t={t}
              />

              <div className="lg:hidden space-y-4">
                {payload.properties.map((p) => (
                  <HostAnalyticsPropertyCard
                    key={p.listing_id}
                    property={p}
                    currency={payload.currency}
                    locale={locale}
                    localePath={localePath}
                    t={t}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : null}

      {loading && payload ? (
        <p
          className="mt-4 text-center text-sm text-nexa-ink-4"
          aria-live="polite"
        >
          {t("hostAnalytics.loading")}
        </p>
      ) : null}
    </div>
  );
}

export default function HostAnalyticsPage({
  embeddedInPortal = false,
}: {
  embeddedInPortal?: boolean;
} = {}) {
  if (embeddedInPortal) {
    return <HostAnalyticsContent />;
  }

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen bg-nexa-bg-1">
        <ProtectedRoute>
          <HostAnalyticsContent />
        </ProtectedRoute>
      </main>
    </>
  );
}
