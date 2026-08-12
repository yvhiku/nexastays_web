"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppLoader } from "@/components/AppLoader";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getHostReviews,
  getHostVerification,
  normalizeHostVerificationStatus,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import type {
  HostReviewsResponse,
  HostVerificationStatus,
} from "@/lib/stays-types";
import { HOST_REVIEWS_DEFAULT_LIMIT } from "@/lib/host-reviews";
import { HostReviewsPage } from "@/components/host/reviews/HostReviewsPage";

/**
 * Orchestrator: verification + getHostReviews + local page state.
 * Pagination stays in React state (not ?page=) — Phase 6 parity.
 */
export default function HostReviewsRoutePage() {
  const { token } = useAuth();
  const { t, locale, localePath } = useLanguage();

  const [hostStatus, setHostStatus] = useState<HostVerificationStatus | null>(
    null,
  );
  const [gateLoading, setGateLoading] = useState(true);
  const [gateError, setGateError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState<HostReviewsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setGateLoading(true);
    setGateError(null);
    getHostVerification(token)
      .then((s) => setHostStatus(normalizeHostVerificationStatus(s)))
      .catch((e) =>
        setGateError(formatUserError(e) || t("hostReviews.failedLoad")),
      )
      .finally(() => setGateLoading(false));
  }, [token, t]);

  const loadReviews = useCallback(
    async (pageNum: number) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getHostReviews(token, {
          page: pageNum,
          limit: HOST_REVIEWS_DEFAULT_LIMIT,
        });
        setPayload(res);
      } catch (e) {
        setPayload(null);
        setError(formatUserError(e) || t("hostReviews.failedLoad"));
      } finally {
        setLoading(false);
      }
    },
    [token, t],
  );

  const approved = (hostStatus?.status ?? "") === "APPROVED";

  useEffect(() => {
    if (!token || !approved) return;
    void loadReviews(page);
  }, [token, approved, page, loadReviews]);

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
          {t("hostPortal.reviews.notApproved")}
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
    <HostReviewsPage
      payload={payload}
      loading={loading}
      error={error}
      page={page}
      onPageChange={setPage}
      onRetry={() => void loadReviews(page)}
      t={t}
      locale={locale}
      localePath={localePath}
    />
  );
}
