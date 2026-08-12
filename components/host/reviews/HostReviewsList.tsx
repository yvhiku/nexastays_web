"use client";

import React from "react";
import type { HostReview } from "@/lib/stays-types";
import { HostReviewCard } from "@/components/host/reviews/HostReviewCard";

type TranslateFn = (key: string) => string;

type Props = {
  reviews: HostReview[];
  shown: number;
  total: number;
  locale: string;
  t: TranslateFn;
};

/** List preserves API response order — no client ranking. */
export function HostReviewsList({
  reviews,
  shown,
  total,
  locale,
  t,
}: Props) {
  return (
    <section className="mb-2" aria-labelledby="host-reviews-list-heading">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2
          id="host-reviews-list-heading"
          className="text-lg font-semibold text-[color:var(--host-text)]"
        >
          {t("hostReviews.listTitle")}
        </h2>
        <p className="text-xs tabular-nums text-[color:var(--host-muted)]">
          {t("hostReviews.showingCount")
            .replace("{shown}", String(shown))
            .replace("{total}", String(total))}
        </p>
      </div>
      <ul className="m-0 list-none space-y-4 p-0">
        {reviews.map((review) => (
          <li key={review.id}>
            <HostReviewCard review={review} locale={locale} t={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}
