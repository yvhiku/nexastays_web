"use client";

import React, { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Grid3X3, BadgeCheck, Zap, ImageOff } from "lucide-react";
import { getListingMediaUrl } from "@/lib/stays-api";
import { cn } from "@/lib/utils";

interface MediaItem {
  asset_id: string;
  kind: string;
  sort_order?: number;
}

interface ListingHeroGalleryProps {
  listingId: string;
  media: MediaItem[];
  alt: string;
  placeholder?: string;
  verified?: boolean;
  instantBooking?: boolean;
  onImageClick?: (imageUrl: string) => void;
  onShowAll?: () => void;
}

const placeholderImg = "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&q=80";

export function ListingHeroGallery({
  listingId,
  media,
  alt,
  placeholder = placeholderImg,
  verified = false,
  instantBooking = false,
  onImageClick,
  onShowAll,
}: ListingHeroGalleryProps) {
  const photos = media
    .filter((m) => m.kind === "PHOTO")
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [activePhoto, setActivePhoto] = useState(0);
  const mobileGalleryRef = useRef<HTMLDivElement | null>(null);

  const getSrc = useCallback(
    (assetId: string) => {
      if (assetId === "placeholder") return placeholder;
      return getListingMediaUrl(listingId, assetId);
    },
    [listingId, placeholder]
  );

  const handleError = (assetId: string) => {
    setImgErrors((prev) => ({ ...prev, [assetId]: true }));
  };

  /**
   * One gallery slot. Listing media is served by the Stays API (often a 302 to a
   * signed URL), so it bypasses the Next image optimizer (`unoptimized`) like
   * ListingCard does. A failed asset renders a distinct "unavailable" state —
   * never the shared Unsplash hero, which made distinct photos look duplicated.
   */
  const renderSlot = (
    assetId: string,
    slotAlt: string,
    opts: { sizes: string; priority?: boolean; hoverScale?: string },
  ) => {
    if (assetId !== "placeholder" && imgErrors[assetId]) {
      return (
        <div
          role="img"
          aria-label={slotAlt}
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-nexa-bg-2 text-nexa-ink-4"
        >
          <ImageOff className="h-6 w-6" aria-hidden="true" />
          <span className="text-xs font-medium">Photo unavailable</span>
        </div>
      );
    }
    return (
      <Image
        src={getSrc(assetId)}
        alt={slotAlt}
        fill
        priority={opts.priority}
        unoptimized={assetId !== "placeholder"}
        sizes={opts.sizes}
        className={cn("object-cover transition-transform duration-700", opts.hoverScale)}
        onError={() => handleError(assetId)}
      />
    );
  };

  const items =
    photos.length > 0
      ? photos
      : [{ asset_id: "placeholder", kind: "PHOTO" as const, sort_order: 0 }];

  const main = items[0];
  const thumbs = items.slice(1, 5);
  const totalCount = items.length;

  const openImage = (assetId: string) => {
    if (assetId !== "placeholder" && imgErrors[assetId]) return;
    onImageClick?.(getSrc(assetId));
  };

  const updateActivePhoto = () => {
    const gallery = mobileGalleryRef.current;
    if (!gallery || gallery.clientWidth === 0) return;
    const next = Math.round(gallery.scrollLeft / gallery.clientWidth);
    setActivePhoto(Math.max(0, Math.min(totalCount - 1, next)));
  };

  return (
    <div className="relative">
      <div
        ref={mobileGalleryRef}
        onScroll={updateActivePhoto}
        className="flex h-[280px] snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl shadow-nexa-card scrollbar-none sm:h-[420px] md:grid md:h-[560px] md:grid-cols-12 md:gap-3 md:overflow-hidden"
      >
        {/* Main image */}
        <div className="group relative h-full min-w-full shrink-0 snap-center md:col-span-8 md:min-w-0">
          <button
            type="button"
            onClick={() => openImage(main.asset_id)}
            className="relative block w-full h-full focus:outline-none"
          >
            {renderSlot(main.asset_id, alt, {
              sizes: "(min-width: 768px) 66vw, 100vw",
              priority: true,
              hoverScale: "group-hover:scale-105",
            })}
          </button>
          <div className="absolute top-5 left-5 flex flex-wrap gap-2">
            {verified && (
              <span className="bg-white/90 backdrop-blur shadow-sm px-3 py-1.5 rounded-full text-xs font-semibold text-nexa-primary flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified Property
              </span>
            )}
            {instantBooking && (
              <span className="bg-nexa-primary text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Instant Book
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail grid — desktop only */}
        {items.slice(1).map((photo, index) => (
          <button
            key={`mobile-${photo.asset_id}`}
            type="button"
            onClick={() => openImage(photo.asset_id)}
            className="relative h-full min-w-full shrink-0 snap-center focus:outline-none md:hidden"
            aria-label={`${alt}, photo ${index + 2} of ${totalCount}`}
          >
            {renderSlot(photo.asset_id, `${alt}, photo ${index + 2}`, { sizes: "100vw" })}
          </button>
        ))}

        {thumbs.length > 0 && (
          <div className="hidden md:grid md:col-span-4 grid-cols-2 grid-rows-2 gap-3 h-full">
            {thumbs.map((photo, i) => (
              <div key={photo.asset_id} className="overflow-hidden group relative h-full">
                <button
                  type="button"
                  onClick={() => openImage(photo.asset_id)}
                  className="relative block w-full h-full focus:outline-none"
                >
                  {renderSlot(photo.asset_id, `${alt} — ${i + 2}`, {
                    sizes: "(min-width: 768px) 17vw, 50vw",
                    hoverScale: "group-hover:scale-110",
                  })}
                </button>
                {i === thumbs.length - 1 && totalCount > 5 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowAll?.();
                    }}
                    className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-lg text-xs font-semibold text-nexa-ink shadow-md hover:bg-nexa-bg-2 transition-colors flex items-center gap-1.5"
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                    Show all {totalCount} photos
                  </button>
                )}
              </div>
            ))}
            {/* Fill empty cells if fewer than 4 thumbs */}
            {Array.from({ length: Math.max(0, 4 - thumbs.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-nexa-bg-2" />
            ))}
          </div>
        )}
      </div>

      {/* Mobile: show all button */}
      {totalCount > 1 && (
        <>
          <div
            className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1.5 backdrop-blur-sm md:hidden"
            aria-live="polite"
            aria-label={`Photo ${activePhoto + 1} of ${totalCount}`}
          >
            {items.map((photo, index) => (
              <span
                key={`indicator-${photo.asset_id}`}
                className={
                  index === activePhoto
                    ? "h-1.5 w-4 rounded-full bg-white transition-all"
                    : "h-1.5 w-1.5 rounded-full bg-white/60 transition-all"
                }
                aria-hidden
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onShowAll}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-nexa-ink shadow-md md:hidden"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            {activePhoto + 1} / {totalCount}
          </button>
        </>
      )}
    </div>
  );
}
