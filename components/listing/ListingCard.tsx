"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BadgeCheck, Lock, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LISTING_TYPES } from "@/lib/host-listing-constants";
import { getShortLocationLabel } from "@/lib/listing-location";
import { getListingMediaUrl } from "@/lib/stays-api";
import type { StaysListing } from "@/lib/stays-types";
import { cn } from "@/lib/utils";
import { SaveButton } from "@/components/saved/SaveButton";
import {
  LISTING_CARD_IMAGE_RATIO,
  LISTING_CARD_RADIUS,
} from "@/components/listing/listing-card-dims";

export {
  LISTING_CARD_IMAGE_RATIO,
  LISTING_CARD_RADIUS,
} from "@/components/listing/listing-card-dims";

const placeholderImg =
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

export interface ListingCardProps {
  listing: StaysListing;
  checkin?: string;
  checkout?: string;
  guests?: number;
  city?: string;
  verifiedWalkthroughOnly?: boolean;
  instantBookingOnly?: boolean;
  listingType?: string;
  t: (key: string) => string;
  tf?: (key: string, vars: Record<string, string | number>) => string;
  localePath: (path: string) => string;
  density?: "default" | "compact";
}

export function ListingCard({
  listing,
  checkin,
  checkout,
  guests,
  city,
  verifiedWalkthroughOnly,
  instantBookingOnly,
  listingType,
  t,
  tf,
  localePath,
  density = "default",
}: ListingCardProps) {
  const router = useRouter();
  const price = listing.rate_plan?.base_price ?? 0;
  const currency = listing.rate_plan?.currency || "MAD";
  const cover = listing.media?.find((m) => m.kind === "PHOTO");
  const hasWalkthrough = listing.media?.some((m) => m.kind === "WALKTHROUGH");
  const coverSrc = cover
    ? getListingMediaUrl(listing.id, cover.asset_id)
    : placeholderImg;
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [coverSrc]);

  const detailUrl = new URLSearchParams();
  if (checkin) detailUrl.set("checkin_date", checkin);
  if (checkout) detailUrl.set("checkout_date", checkout);
  if (guests) detailUrl.set("guests", String(guests));
  if (city) detailUrl.set("city", city);
  if (verifiedWalkthroughOnly) detailUrl.set("verified_walkthrough_only", "true");
  if (instantBookingOnly) detailUrl.set("instant_booking_only", "true");
  if (listingType && listingType !== "all") detailUrl.set("listing_type", listingType);
  const linkHref = localePath(
    `/listings/${listing.id}${detailUrl.toString() ? `?${detailUrl}` : ""}`,
  );

  const title = toTitleCase(listing.title);
  const description =
    listing.description?.trim() ||
    `${listingTypeLabel(listing.listing_type)} in ${listing.city}`;
  const avgRating =
    listing.avg_rating != null && Number.isFinite(Number(listing.avg_rating))
      ? Number(listing.avg_rating)
      : 0;
  const reviewCount = Math.max(0, Number(listing.review_count ?? 0));

  return (
    <article
      className={cn(
        "group bg-white overflow-hidden shadow-nexa-card border border-nexa-line/50 transition-all duration-300 hover:shadow-nexa-md hover:border-nexa-line hover:-translate-y-0.5 min-w-0 w-full",
        LISTING_CARD_RADIUS,
      )}
    >
      <div className="relative block">
        <button
          type="button"
          className="relative block w-full overflow-hidden rounded-t-2xl bg-nexa-bg-2"
          style={{ aspectRatio: LISTING_CARD_IMAGE_RATIO }}
          onClick={() => router.push(linkHref)}
          aria-label={title}
        >
          <Image
            src={imgError ? placeholderImg : coverSrc}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              "object-cover transition-[opacity,transform] duration-300 group-hover:scale-[1.03]",
              imgLoaded ? "opacity-100" : "opacity-0",
            )}
            loading="lazy"
            unoptimized={Boolean(cover) && !imgError}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true);
              setImgLoaded(true);
            }}
          />
        </button>

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 pointer-events-none rounded-t-2xl" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
          <span className="inline-flex px-2.5 py-1 rounded-full text-[0.65rem] font-semibold uppercase tracking-wide bg-white/95 text-nexa-ink shadow-sm font-sans">
            {listingTypeLabel(listing.listing_type)}
          </span>
          <SaveButton
            listingId={listing.id}
            snapshot={{
              id: listing.id,
              title: listing.title,
              city: listing.city,
              imageUrl: cover ? coverSrc : undefined,
            }}
            className="relative z-20"
          />
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 z-10 pointer-events-none">
          {/* Ranking badges reserved (Recommended / Best Value / …) — Phase 2 */}
          <div className="flex flex-wrap items-center gap-1.5 min-h-[1.5rem]">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.65rem] font-semibold bg-white/95 text-nexa-ink shadow-sm font-sans">
              {listing.instant_booking ? (
                <>
                  <Zap className="w-3 h-3 text-nexa-primary fill-nexa-primary" />
                  Instant
                </>
              ) : hasWalkthrough ? (
                <>
                  <BadgeCheck className="w-3 h-3 text-green-700" />
                  Verified
                </>
              ) : (
                <>
                  <BadgeCheck className="w-3 h-3 text-nexa-ink-4" />
                  Listed
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className={cn("font-sans", density === "compact" ? "p-3.5 sm:p-4" : "p-4 sm:p-5")}>
        <div className={cn("mb-1 flex items-start justify-between gap-3", density === "compact" && "mb-0.5")}>
        <p className="text-xs font-medium text-nexa-ink-4 tracking-wider">
            {getShortLocationLabel(listing)}
          </p>
          <div
            className="shrink-0 text-right"
            aria-label={`${avgRating.toFixed(1)} out of 5, ${reviewCount} reviews`}
          >
            <p className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-nexa-ink">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {avgRating.toFixed(1)}
            </p>
            <p className="text-[0.65rem] leading-tight text-nexa-ink-4 tabular-nums">
              {tf
                ? tf("listings.reviewCount", { count: reviewCount })
                : t("listings.reviewCount").replace(
                    "{count}",
                    String(reviewCount),
                  )}
            </p>
          </div>
        </div>
        <Link href={linkHref} className="block hover:text-nexa-primary transition-colors">
          <h3 className="font-display font-semibold text-base text-nexa-ink mb-1.5 line-clamp-1">
            {title}
          </h3>
        </Link>
        <p className={cn(
          "text-sm text-nexa-ink-3 line-clamp-2 leading-relaxed",
          density === "compact" ? "mb-3 min-h-[2.25rem]" : "mb-4 min-h-[2.5rem]",
        )}>
          {listing.description?.trim()
            ? description
            : getShortLocationLabel(listing)}
        </p>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-nexa-line/60">
          <div className="min-w-0">
            <span className="font-bold text-lg text-nexa-ink tabular-nums">{price}</span>
            <span className="text-sm text-nexa-ink-4 ml-1">{currency}/night</span>
          </div>
          <Button size="sm" asChild className="rounded-xl font-medium shrink-0 shadow-nexa-sm">
            <Link href={linkHref}>{t("listings.viewStay")}</Link>
          </Button>
        </div>

        <p className="text-[0.7rem] text-nexa-ink-4 pt-3 mt-3 border-t border-nexa-line/40 flex items-center gap-1.5 leading-snug">
          <Lock className="w-3 h-3 text-nexa-accent shrink-0" />
          <span>{t("listings.contactRevealed")}</span>
        </p>
      </div>
    </article>
  );
}
