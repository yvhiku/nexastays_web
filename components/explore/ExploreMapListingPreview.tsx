"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Star, X, Zap } from "lucide-react";
import { SaveButton } from "@/components/saved/SaveButton";
import { LISTING_TYPES } from "@/lib/host-listing-constants";
import { cleanText } from "@/lib/clean-text";
import { parseNeighborhood } from "@/lib/listing-location";
import { getListingMediaUrl } from "@/lib/stays-api";
import type { StaysListing } from "@/lib/stays-types";
import { cn } from "@/lib/utils";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80";

function listingTypeLabel(type: string): string {
  return LISTING_TYPES.find((t) => t.id === type)?.label ?? type;
}

function toTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export type ExploreMapListingPreviewProps = {
  listing: StaysListing;
  detailHref: string;
  viewStayLabel: string;
  previewEnter: boolean;
  /** Matches ExploreMap sizeVariant — full map allows a wider card. */
  sizeVariant?: "default" | "panel";
  onClose: () => void;
};

export function ExploreMapListingPreview({
  listing,
  detailHref,
  viewStayLabel,
  previewEnter,
  sizeVariant = "default",
  onClose,
}: ExploreMapListingPreviewProps) {
  const photos = listing.media?.filter((m) => m.kind === "PHOTO") ?? [];
  const cover = photos[0];
  const photoCount = photos.length;
  const [coverError, setCoverError] = useState(false);
  const coverSrc =
    cover && !coverError
      ? getListingMediaUrl(listing.id, cover.asset_id)
      : PLACEHOLDER_IMG;

  useEffect(() => {
    setCoverError(false);
  }, [listing.id, cover?.asset_id]);

  const title = toTitleCase(cleanText(listing.title));
  const neighborhood = parseNeighborhood(listing);
  const locationLine = [neighborhood, listing.city].filter(Boolean).join(" · ");
  const rating =
    listing.avg_rating != null && Number.isFinite(Number(listing.avg_rating))
      ? Number(listing.avg_rating)
      : null;
  const reviewCount = Math.max(0, Number(listing.review_count ?? 0));
  const hasWalkthrough = listing.media?.some((m) => m.kind === "WALKTHROUGH");
  const price = listing.rate_plan?.base_price;
  const currency = listing.rate_plan?.currency || "MAD";
  const trustBadge = listing.instant_booking
    ? ("instant" as const)
    : hasWalkthrough
      ? ("verified" as const)
      : null;

  const maxWidth =
    sizeVariant === "default"
      ? "sm:w-[min(100%-2rem,45rem)]"
      : "sm:w-[min(100%-2rem,40rem)]";

  return (
    /* Outer shell does not capture map pan/zoom — only the card is interactive */
    <div
      className={cn(
        "pointer-events-none absolute bottom-4 left-1/2 z-layer-popover w-[min(100%-1rem,24rem)] -translate-x-1/2",
        maxWidth,
      )}
    >
      <div
        className={cn(
          "pointer-events-auto group relative overflow-hidden rounded-[22px] border border-nexa-line bg-white shadow-[0_16px_48px_rgba(15,23,42,0.16)] transition-all duration-150 ease-out hover:shadow-[0_20px_56px_rgba(15,23,42,0.2)]",
          previewEnter
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-layer-content flex h-8 w-8 items-center justify-center rounded-full border border-nexa-line/80 bg-white text-nexa-ink-3 shadow-sm hover:bg-nexa-bg-2 hover:text-nexa-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>

        <div className="flex flex-col sm:min-h-[19rem] sm:flex-row">
          <Link
            href={detailHref}
            className="relative block h-[168px] w-full shrink-0 overflow-hidden bg-nexa-bg-2 sm:h-auto sm:w-[42%] sm:min-h-[19rem]"
          >
            <Image
              src={coverSrc}
              alt={title}
              fill
              sizes="(max-width: 640px) 90vw, 300px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              unoptimized={Boolean(cover) && !coverError}
              onError={() => setCoverError(true)}
            />

            <span className="absolute left-3 top-3 inline-flex rounded-full bg-white/95 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-nexa-ink shadow-sm">
              {listingTypeLabel(listing.listing_type)}
            </span>

            <div className="absolute right-12 top-3 sm:right-3">
              <SaveButton
                listingId={listing.id}
                snapshot={{
                  id: listing.id,
                  title: listing.title,
                  city: listing.city,
                  imageUrl: cover ? coverSrc : undefined,
                }}
              />
            </div>

            {photoCount > 1 && (
              <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2 py-0.5 text-[0.65rem] font-medium text-white">
                {photoCount} photos
              </span>
            )}
          </Link>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 pe-12 sm:p-5 sm:pe-12 sm:py-6">
            <div className="min-w-0">
              <Link href={detailHref} className="block min-w-0">
                <h3 className="font-display text-lg font-semibold leading-snug text-nexa-ink line-clamp-2 sm:text-xl">
                  {title}
                </h3>
              </Link>

              <div className="mt-2 flex items-center gap-1.5 text-sm text-nexa-ink-3">
                <Star
                  className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
                  aria-hidden
                />
                <span className="font-semibold tabular-nums text-nexa-ink">
                  {rating != null ? rating.toFixed(1) : "0.0"}
                </span>
                <span className="text-nexa-ink-4">·</span>
                <span className="text-nexa-ink-4">
                  {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                </span>
              </div>

              {locationLine && (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-nexa-ink-4">
                  <MapPin
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-nexa-ink-4"
                    aria-hidden
                  />
                  <span className="line-clamp-1">{locationLine}</span>
                </p>
              )}

              {trustBadge && (
                <div className="mt-3">
                  {trustBadge === "instant" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-nexa-primary-soft px-2.5 py-1 text-[0.7rem] font-semibold text-nexa-primary">
                      <Zap className="h-3 w-3 fill-nexa-primary" aria-hidden />
                      Instant Booking
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-nexa-bg-2 px-2.5 py-1 text-[0.7rem] font-semibold text-nexa-ink">
                      <BadgeCheck
                        className="h-3.5 w-3.5 text-green-700"
                        aria-hidden
                      />
                      Verified Stay
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              {price != null ? (
                <div className="min-w-0">
                  <p className="text-xl font-bold tabular-nums tracking-tight text-nexa-ink sm:text-2xl">
                    {Math.round(Number(price)).toLocaleString("en-MA")}{" "}
                    {currency}
                  </p>
                  <p className="text-xs text-nexa-ink-4">per night</p>
                </div>
              ) : (
                <span />
              )}

              <Link
                href={detailHref}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-nexa-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-nexa-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
              >
                {viewStayLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
