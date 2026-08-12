"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  parseHostAnalyticsPeriod,
} from "@/lib/host-analytics";
import { HostInsightsPage } from "@/components/host/analytics/HostInsightsPage";

export default function HostAnalyticsRoutePage() {
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

  if (gateLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (gateError) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="mb-6 text-nexa-ink-3">{gateError}</p>
        <Button asChild>
          <Link href={localePath("/host/dashboard")}>
            {t("hostPortal.nav.home")}
          </Link>
        </Button>
      </div>
    );
  }

  if (!approved) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="mb-6 text-nexa-ink-3">
          {t("hostPortal.analytics.notApproved")}
        </p>
        <Button asChild>
          <Link href={localePath("/host/dashboard")}>
            {t("hostPortal.nav.home")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <HostInsightsPage
      payload={payload}
      loading={loading}
      error={error}
      onRetry={() => void loadAnalytics(period)}
      period={period}
      onPeriodChange={onPeriodChange}
      t={t}
      locale={locale}
      localePath={localePath}
    />
  );
}
