"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { getListingReviews, getReviewMediaUrl } from "@/lib/stays-api";
import type { ListingReview, ReviewSort } from "@/lib/stays-types";
import { StarRatingDisplay } from "./StarRatingSelector";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { cn } from "@/lib/utils";

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function ReviewCard({ review }: { review: ListingReview }) {
  return (
    <article className="py-6 border-b border-nexa-line/50 last:border-0">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-nexa-primary/15 flex items-center justify-center shrink-0 text-sm font-bold text-nexa-primary">
          {review.guest_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-nexa-ink dark:text-white text-sm">
              {review.guest_name}
            </span>
            {review.is_verified_stay && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-green-700 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full">
                <BadgeCheck className="h-3 w-3" />
                Verified stay
              </span>
            )}
            {review.is_edited && (
              <span className="text-[10px] text-nexa-ink-4 uppercase tracking-wide">Edited</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRatingDisplay rating={review.rating} />
            <span className="text-xs text-nexa-ink-4">{formatReviewDate(review.created_at)}</span>
          </div>
          {review.comment && (
            <p className="mt-3 text-sm text-nexa-ink-3 dark:text-nexa-ink-2 leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          )}
          {review.media.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {review.media.map((m) => (
                <a
                  key={m.asset_id}
                  href={getReviewMediaUrl(m.asset_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-20 w-20 rounded-lg overflow-hidden border border-nexa-line/40 hover:opacity-90 transition-opacity"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getReviewMediaUrl(m.asset_id)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Histogram({
  distribution,
  total,
}: {
  distribution: Record<string, number>;
  total: number;
}) {
  const stars = ["5", "4", "3", "2", "1"] as const;
  const max = Math.max(...stars.map((s) => distribution[s] ?? 0), 1);

  return (
    <div className="space-y-2">
      {stars.map((star) => {
        const count = distribution[star] ?? 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-nexa-ink-3 tabular-nums">
              {star} ★
            </span>
            <div className="flex-1 h-2 rounded-full bg-nexa-bg-2 dark:bg-nexa-ink/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-nexa-ink-4 tabular-nums text-xs">
              {count}
            </span>
            <span className="w-10 text-right text-nexa-ink-4 tabular-nums text-xs hidden sm:inline">
              {pct.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="py-6 border-b border-nexa-line/40 animate-pulse">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-nexa-bg-2" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-nexa-bg-2 rounded" />
          <div className="h-3 w-24 bg-nexa-bg-2 rounded" />
          <div className="h-16 w-full bg-nexa-bg-2 rounded mt-2" />
        </div>
      </div>
    </div>
  );
}

interface ListingReviewsSectionProps {
  listingId: string;
  initialAvg?: number | null;
  initialCount?: number;
}

export function ListingReviewsSection({
  listingId,
  initialAvg,
  initialCount = 0,
}: ListingReviewsSectionProps) {
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [avg, setAvg] = useState<number | null>(initialAvg ?? null);
  const [total, setTotal] = useState(initialCount);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<ReviewSort>("newest");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (pageNum: number, sortVal: ReviewSort, append: boolean) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await getListingReviews(listingId, {
          page: pageNum,
          limit: 10,
          sort: sortVal,
        });
        setReviews((prev) => (append ? [...prev, ...res.reviews] : res.reviews));
        setAvg(res.summary.overall_avg_rating);
        setTotal(res.summary.total_count);
        setDistribution(res.summary.distribution ?? {});
        setHasMore(res.page * res.limit < res.total);
        setPage(pageNum);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [listingId],
  );

  useEffect(() => {
    load(1, sort, false);
  }, [listingId, sort, load]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadingMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          load(page + 1, sort, true);
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, page, sort, load]);

  if (!loading && total === 0) {
    return (
      <section className="border-t border-nexa-line/60 pt-10">
        <h2 className="font-display text-2xl font-semibold mb-4">Reviews</h2>
        <p className="text-nexa-ink-3 text-sm">No reviews yet. Be the first to share your experience.</p>
      </section>
    );
  }

  return (
    <section className="border-t border-nexa-line/60 pt-10" id="reviews">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl font-semibold text-nexa-ink dark:text-white">
            Reviews
          </h2>
          {avg != null && total > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <StarRatingDisplay rating={avg} size="md" />
              <span className="font-bold text-lg text-nexa-ink dark:text-white tabular-nums">
                {avg.toFixed(2)}
              </span>
              <span className="text-sm text-nexa-ink-3">
                ({total} {total === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
        <NexaSelect
          variant="pill"
          value={sort}
          onChange={(v) => setSort(v as ReviewSort)}
          aria-label="Sort reviews"
          options={[
            { value: "newest", label: "Newest" },
            { value: "highest", label: "Highest rated" },
            { value: "lowest", label: "Lowest rated" },
          ]}
        />
      </div>

      {total > 0 && Object.keys(distribution).length > 0 && (
        <div className="mb-8 p-5 rounded-2xl bg-nexa-bg-2/80 dark:bg-nexa-ink/20 border border-nexa-line/40">
          <h3 className="text-sm font-semibold text-nexa-ink mb-4">Rating breakdown</h3>
          <Histogram distribution={distribution} total={total} />
        </div>
      )}

      <div>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)
          : reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-nexa-primary" />
          </div>
        )}
        <div ref={sentinelRef} className="h-1" aria-hidden />
      </div>
    </section>
  );
}
