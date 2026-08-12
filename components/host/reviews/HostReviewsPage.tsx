"use client";

import React from "react";
import type { HostReviewsResponse } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import {
  HOST_REVIEWS_DEFAULT_LIMIT,
  emptyHostReviewSummary,
  isHostReviewsEmpty,
} from "@/lib/host-reviews";
import { HostReviewsHeader } from "@/components/host/reviews/HostReviewsHeader";
import { HostReviewsSummary } from "@/components/host/reviews/HostReviewsSummary";
import { HostReviewsList } from "@/components/host/reviews/HostReviewsList";
import { HostReviewPagination } from "@/components/host/reviews/HostReviewPagination";
import { HostReviewsEmptyState } from "@/components/host/reviews/HostReviewsEmptyState";
import { HostReviewSkeleton } from "@/components/host/reviews/HostReviewSkeleton";
import { HostReviewsQuickLinks } from "@/components/host/reviews/HostReviewsQuickLinks";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { Button } from "@/components/ui/button";

type TranslateFn = (key: string) => string;

export type HostReviewsPageProps = {
  payload: HostReviewsResponse | null;
  loading: boolean;
  error: string | null;
  page: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
};

/**
 * Presentation composer. Gate/fetch/page state stay in route page.tsx.
 * Pagination: local page only — no ?page= URL sync (matches prior behavior).
 */
export function HostReviewsPage({
  payload,
  loading,
  error,
  page,
  onPageChange,
  onRetry,
  t,
  locale,
  localePath,
}: HostReviewsPageProps) {
  const summary = payload?.summary ?? emptyHostReviewSummary();
  const reviews = payload?.reviews ?? [];
  const total = payload?.total ?? 0;
  const limit = payload?.limit ?? HOST_REVIEWS_DEFAULT_LIMIT;
  const empty = payload != null && !error && isHostReviewsEmpty(payload);
  const showList = payload != null && !error && !empty;

  return (
    <div className="pb-4">
      <HostReviewsHeader t={t} />

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
            {t("hostReviews.retry")}
          </Button>
        </HostPortalCard>
      ) : null}

      {!error ? (
        <HostReviewsSummary
          summary={summary}
          t={t}
          loading={loading && !payload}
        />
      ) : null}

      {!error && loading && !payload ? <HostReviewSkeleton /> : null}

      {empty ? <HostReviewsEmptyState t={t} /> : null}

      {showList ? (
        <>
          <HostReviewsList
            reviews={reviews}
            shown={reviews.length}
            total={total}
            locale={locale}
            t={t}
          />
          <HostReviewPagination
            page={page}
            limit={limit}
            total={total}
            loading={loading}
            onPageChange={onPageChange}
            t={t}
          />
        </>
      ) : null}

      {loading && payload ? (
        <p
          className="mt-4 text-center text-sm text-[color:var(--host-muted)]"
          aria-live="polite"
        >
          {t("hostReviews.loading")}
        </p>
      ) : null}

      <HostReviewsQuickLinks t={t} localePath={localePath} />
    </div>
  );
}
