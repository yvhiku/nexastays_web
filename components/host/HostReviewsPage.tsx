"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLoader } from "@/components/AppLoader";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getHostReviews,
  getHostVerification,
  normalizeHostVerificationStatus,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import type { HostReviewsResponse, HostVerificationStatus } from "@/lib/stays-types";
import {
  HOST_REVIEWS_DEFAULT_LIMIT,
  emptyHostReviewSummary,
  isHostReviewsEmpty,
} from "@/lib/host-reviews";
import { HostReviewsSummary } from "@/components/host/HostReviewsSummary";
import { HostReviewCard } from "@/components/host/HostReviewCard";
import { HostReviewPagination } from "@/components/host/HostReviewPagination";

function HostReviewsContent() {
  const { token } = useAuth();
  const { t, locale, localePath } = useLanguage();

  const [hostStatus, setHostStatus] = useState<HostVerificationStatus | null>(null);
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
      .catch((e) => setGateError(formatUserError(e) || t("hostReviews.failedLoad")))
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
            {t("hostReviews.backToDashboard")}
          </Link>
        </Button>
      </div>
    );
  }

  if (!approved) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <p className="text-nexa-ink-3 mb-6">{t("hostReviews.notApproved")}</p>
        <Button asChild>
          <Link href={localePath("/host/dashboard")}>
            {t("hostReviews.backToDashboard")}
          </Link>
        </Button>
      </div>
    );
  }

  const summary = payload?.summary ?? emptyHostReviewSummary();
  const reviews = payload?.reviews ?? [];
  const total = payload?.total ?? 0;
  const limit = payload?.limit ?? HOST_REVIEWS_DEFAULT_LIMIT;
  const empty = payload != null && !error && isHostReviewsEmpty(payload);
  const showList = payload != null && !error && !empty;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ms-2">
          <Link
            href={localePath("/host/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            {t("hostReviews.backToDashboard")}
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-nexa-ink">
          {t("hostReviews.title")}
        </h1>
        <p className="text-nexa-ink-3 mt-1">{t("hostReviews.description")}</p>
      </div>

      {error && (
        <div className="mb-6 space-y-3">
          <ErrorAlert error={error} onDismiss={() => setError(null)} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadReviews(page)}
          >
            {t("hostReviews.retry")}
          </Button>
        </div>
      )}

      {!error ? (
        <HostReviewsSummary
          summary={summary}
          t={t}
          loading={loading && !payload}
        />
      ) : null}

      {loading && !payload && !error ? (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl border border-nexa-line bg-white animate-pulse"
            />
          ))}
        </div>
      ) : null}

      {empty ? (
        <section
          className="rounded-2xl border border-nexa-line bg-white p-8 text-center"
          aria-labelledby="host-reviews-empty"
        >
          <h2
            id="host-reviews-empty"
            className="text-lg font-semibold text-nexa-ink mb-2"
          >
            {t("hostReviews.emptyTitle")}
          </h2>
          <p className="text-sm text-nexa-ink-3">{t("hostReviews.emptyDesc")}</p>
        </section>
      ) : null}

      {showList ? (
        <>
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-nexa-ink">
              {t("hostReviews.listTitle")}
            </h2>
            <p className="text-xs text-nexa-ink-4 tabular-nums">
              {t("hostReviews.showingCount")
                .replace("{shown}", String(reviews.length))
                .replace("{total}", String(total))}
            </p>
          </div>
          <ul className="space-y-4 list-none p-0 m-0">
            {reviews.map((review) => (
              <li key={review.id}>
                <HostReviewCard review={review} locale={locale} t={t} />
              </li>
            ))}
          </ul>
          <HostReviewPagination
            page={page}
            limit={limit}
            total={total}
            loading={loading}
            onPageChange={setPage}
            t={t}
          />
        </>
      ) : null}

      {loading && payload ? (
        <p className="mt-4 text-center text-sm text-nexa-ink-4" aria-live="polite">
          {t("hostReviews.loading")}
        </p>
      ) : null}
    </div>
  );
}

export default function HostReviewsPage({
  embeddedInPortal = false,
}: {
  embeddedInPortal?: boolean;
} = {}) {
  if (embeddedInPortal) {
    return <HostReviewsContent />;
  }

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen bg-nexa-bg-1">
        <ProtectedRoute>
          <HostReviewsContent />
        </ProtectedRoute>
      </main>
    </>
  );
}
