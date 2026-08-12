"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  hostReviewsHasNext,
  hostReviewsHasPrevious,
  hostReviewsTotalPages,
} from "@/lib/host-reviews";

type TranslateFn = (key: string) => string;

type Props = {
  page: number;
  limit: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  t: TranslateFn;
};

/**
 * Same contract as legacy HostReviewPagination:
 * previous/next only; local page state; no page-size redesign.
 */
export function HostReviewPagination({
  page,
  limit,
  total,
  loading,
  onPageChange,
  t,
}: Props) {
  if (total <= 0) return null;

  const totalPages = hostReviewsTotalPages(total, limit);
  if (totalPages <= 1) return null;

  const hasPrev = hostReviewsHasPrevious(page);
  const hasNext = hostReviewsHasNext(page, limit, total);

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
      aria-label={t("hostReviews.pagination")}
    >
      <p className="text-sm tabular-nums text-[color:var(--host-text-secondary)]">
        {t("hostReviews.pageOf")
          .replace("{page}", String(page))
          .replace("{totalPages}", String(totalPages))}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrev || loading}
          onClick={() => onPageChange(page - 1)}
        >
          {t("hostReviews.previous")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasNext || loading}
          onClick={() => onPageChange(page + 1)}
        >
          {t("hostReviews.next")}
        </Button>
      </div>
    </nav>
  );
}
