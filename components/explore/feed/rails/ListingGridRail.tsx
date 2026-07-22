"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ListingCard } from "@/components/listing/ListingCard";
import { ListingCardSkeleton } from "@/components/ui/skeleton";
import type { ListingGridRailData } from "../types";
import type { StaysListing } from "@/lib/stays-types";

type Props = {
  data: ListingGridRailData;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  localePath: (path: string) => string;
  onLoadMore?: () => void;
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
};

export function ListingGridRail({
  data,
  t,
  tf,
  localePath,
  onLoadMore,
  loadMoreRef,
  className,
}: Props) {
  const {
    listings,
    density = "default",
    checkin,
    checkout,
    guests,
    city,
    verifiedOnly,
    instantOnly,
    listingType,
    showLoadMore,
    isLoadingMore,
    hasMore,
    isRevalidating,
  } = data;

  if (listings.length === 0 && !showLoadMore) return null;

  const gapClass = density === "compact" ? "gap-3" : "gap-4";

  return (
    <div className={cn("min-w-0", className)}>
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4",
          gapClass,
        )}
        aria-busy={isRevalidating}
      >
        {listings.map((l: StaysListing) => (
          <ListingCard
            key={l.id}
            listing={l}
            checkin={checkin}
            checkout={checkout}
            guests={guests}
            city={city}
            verifiedWalkthroughOnly={verifiedOnly}
            instantBookingOnly={instantOnly}
            listingType={listingType}
            density={density}
            t={t}
            tf={tf}
            localePath={localePath}
          />
        ))}
      </div>
      {showLoadMore && (
        <>
          <div ref={loadMoreRef} className="h-8 w-full" aria-hidden />
          {isLoadingMore && (
            <div
              className={cn("mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gapClass)}
              aria-busy="true"
            >
              <ListingCardSkeleton />
              <div className="hidden sm:block">
                <ListingCardSkeleton />
              </div>
              <div className="hidden lg:block">
                <ListingCardSkeleton />
              </div>
            </div>
          )}
          {hasMore && onLoadMore && (
            <div className="mb-6 flex justify-center">
              <button
                type="button"
                onClick={() => void onLoadMore()}
                disabled={isLoadingMore}
                className="rounded-xl border border-nexa-line bg-white px-5 py-2.5 text-sm font-semibold text-nexa-ink-2 transition hover:border-nexa-primary/40 hover:text-nexa-primary disabled:opacity-50"
              >
                {t("listings.loadMore")}
              </button>
            </div>
          )}
          {!hasMore && listings.length > 0 && (
            <p className="mb-6 text-center text-sm text-nexa-ink-4">
              {t("listings.endOfResults")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
