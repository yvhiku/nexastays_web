"use client";

import React from "react";
import type { HostReview } from "@/lib/stays-types";
import { StarRatingDisplay } from "@/components/ui/StarRatingDisplay";
import { formatHostReviewDate } from "@/lib/host-reviews";

type TranslateFn = (key: string) => string;

interface HostReviewCardProps {
  review: HostReview;
  locale: string;
  t: TranslateFn;
}

export function HostReviewCard({ review, locale, t }: HostReviewCardProps) {
  const initial = (review.guest_name || "?").charAt(0).toUpperCase();
  const dateLabel = formatHostReviewDate(review.created_at, locale);

  return (
    <article className="rounded-2xl border border-nexa-line bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-full bg-nexa-primary/15 flex items-center justify-center shrink-0 text-sm font-bold text-nexa-primary"
          aria-hidden
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-nexa-ink text-sm">
              {review.guest_name || t("hostReviews.guestFallback")}
            </span>
            <span className="text-xs text-nexa-ink-4">{dateLabel}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StarRatingDisplay rating={review.rating} size="sm" />
            <span className="text-sm font-medium text-nexa-ink tabular-nums">
              {Number(review.rating).toFixed(1)}
            </span>
          </div>
          <p className="mt-2 text-xs text-nexa-ink-3">
            <span className="text-nexa-ink-4">{t("hostReviews.listing")}: </span>
            <span className="font-medium text-nexa-ink">{review.listing_title}</span>
          </p>
          {review.comment ? (
            <p className="mt-3 text-sm text-nexa-ink-3 leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          ) : (
            <p className="mt-3 text-sm text-nexa-ink-4 italic">
              {t("hostReviews.noComment")}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
