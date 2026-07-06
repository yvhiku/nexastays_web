"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Heart, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingImageGallery } from "@/components/listing/ListingImageGallery";
import { LISTING_TYPES } from "@/lib/host-listing-constants";
import { getShortLocationLabel } from "@/lib/listing-location";
import type { StaysListing } from "@/lib/stays-types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { isListingSaved, toggleSavedListing } from "@/lib/saved-listings";

const placeholderImg = "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80";

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
  t: (key: string) => string;
  localePath: (path: string) => string;
}

export function ListingCard({
  listing,
  checkin,
  checkout,
  guests,
  city,
  t,
  localePath,
}: ListingCardProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const price = listing.rate_plan?.base_price ?? 0;
  const currency = listing.rate_plan?.currency || "MAD";
  const photoCount = listing.media?.filter((m) => m.kind === "PHOTO").length ?? 0;
  const hasWalkthrough = listing.media?.some((m) => m.kind === "WALKTHROUGH");
  const hasMultiplePhotos = photoCount > 1;
  const [photoIndex, setPhotoIndex] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isListingSaved(listing.id, userId));
    const onChange = () => setSaved(isListingSaved(listing.id, userId));
    window.addEventListener("nexa-saved-listings-changed", onChange);
    return () => window.removeEventListener("nexa-saved-listings-changed", onChange);
  }, [listing.id, userId]);

  const detailUrl = new URLSearchParams();
  if (checkin) detailUrl.set("checkin", checkin);
  if (checkout) detailUrl.set("checkout", checkout);
  if (guests) detailUrl.set("guests", String(guests));
  if (city) detailUrl.set("city", city);
  const linkHref = localePath(
    `/listings/${listing.id}${detailUrl.toString() ? `?${detailUrl}` : ""}`,
  );

  const title = toTitleCase(listing.title);
  const description =
    listing.description?.trim() ||
    `${listingTypeLabel(listing.listing_type)} in ${listing.city}`;

  return (
    <article className="group bg-white rounded-2xl overflow-hidden shadow-nexa-card border border-nexa-line/50 transition-all duration-300 hover:shadow-nexa-md hover:border-nexa-line hover:-translate-y-0.5">
      <div className="relative block">
        <ListingImageGallery
          listingId={listing.id}
          media={listing.media ?? []}
          alt={title}
          placeholder={placeholderImg}
          aspectRatio="4/3"
          roundedClass="rounded-t-2xl rounded-b-none"
          showArrows={hasMultiplePhotos}
          showDots={hasMultiplePhotos}
          showCounter={false}
          arrowsOnHover
          onIndexChange={setPhotoIndex}
          onImageClick={() => router.push(linkHref)}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 pointer-events-none rounded-t-2xl" />

        {/* Top bar */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
          <span className="inline-flex px-2.5 py-1 rounded-full text-[0.65rem] font-semibold uppercase tracking-wide bg-white/95 text-nexa-ink shadow-sm font-sans">
            {listingTypeLabel(listing.listing_type)}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasMultiplePhotos && (
              <span className="px-2 py-0.5 rounded-full bg-black/55 text-white text-[0.65rem] font-medium tabular-nums font-sans">
                {photoIndex + 1} / {photoCount}
              </span>
            )}
            <button
              type="button"
              className={cn(
                "w-8 h-8 rounded-full bg-white/95 flex items-center justify-center hover:bg-white shadow-sm transition-colors relative z-20",
                saved ? "text-nexa-primary" : "text-nexa-ink-4 hover:text-nexa-primary",
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSaved(toggleSavedListing(listing.id, userId));
              }}
              aria-label={t("common.save")}
              aria-pressed={saved}
            >
              <Heart className={cn("w-4 h-4", saved && "fill-nexa-primary")} />
            </button>
          </div>
        </div>

        {/* Bottom badges */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 z-10 pointer-events-none">
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
          {(photoCount > 0 || hasWalkthrough) && (
            <span className="text-[0.65rem] text-white/90 drop-shadow-sm font-sans">
              {photoCount > 0 && `${photoCount} photo${photoCount !== 1 ? "s" : ""}`}
              {photoCount > 0 && hasWalkthrough && " · "}
              {hasWalkthrough && "Video"}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 font-sans">
        <p className="text-xs font-medium text-nexa-ink-4 uppercase tracking-wider mb-1">
          {getShortLocationLabel(listing)}
        </p>
        <Link href={linkHref} className="block hover:text-nexa-primary transition-colors">
          <h3 className="font-display font-semibold text-base text-nexa-ink mb-1.5 line-clamp-1">
            {title}
          </h3>
        </Link>
        <p className="text-sm text-nexa-ink-3 line-clamp-2 mb-4 min-h-[2.5rem] leading-relaxed">
          {description}
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
