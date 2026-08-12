"use client";

import React from "react";
import type { HostReview } from "@/lib/stays-types";
import { StarRatingDisplay } from "@/components/ui/StarRatingDisplay";
import { formatHostReviewDate } from "@/lib/host-reviews";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";

type TranslateFn = (key: string) => string;

type Props = {
  review: HostReview;
  locale: string;
  t: TranslateFn;
};

export function HostReviewCard({ review, locale, t }: Props) {
  const initial = (review.guest_name || "?").charAt(0).toUpperCase();
  const dateLabel = formatHostReviewDate(review.created_at, locale);
  const ratingValue = Number(review.rating);

  return (
    <HostPortalCard className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--host-primary-soft)] text-sm font-bold text-[color:var(--host-primary)]"
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-[color:var(--host-text)]">
              {review.guest_name || t("hostReviews.guestFallback")}
            </span>
            <span className="text-xs text-[color:var(--host-muted)]">
              {dateLabel}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StarRatingDisplay rating={ratingValue} size="sm" />
            <span
              className="text-sm font-medium tabular-nums text-[color:var(--host-text)]"
              aria-label={`${ratingValue.toFixed(1)} out of 5`}
            >
              {ratingValue.toFixed(1)}
            </span>
          </div>
          <p className="mt-2 text-xs text-[color:var(--host-text-secondary)]">
            <span className="text-[color:var(--host-muted)]">
              {t("hostReviews.listing")}:{" "}
            </span>
            <span className="font-medium text-[color:var(--host-text)]">
              {review.listing_title}
            </span>
          </p>
          {review.comment ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--host-text-secondary)]">
              {review.comment}
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-[color:var(--host-muted)]">
              {t("hostReviews.noComment")}
            </p>
          )}
        </div>
      </div>
    </HostPortalCard>
  );
}
