"use client";

import React, { useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getListingMediaUrl } from "@/lib/stays-api";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 50;

interface MediaItem {
  asset_id: string;
  kind: string;
  sort_order?: number;
}

interface ListingImageGalleryProps {
  listingId: string;
  media: MediaItem[];
  alt: string;
  placeholder?: string;
  aspectRatio?: "4/3" | "16/9" | "1/1";
  className?: string;
  onImageClick?: (imageUrl: string) => void;
  showDots?: boolean;
  showArrows?: boolean;
  showCounter?: boolean;
  /** e.g. rounded-t-2xl rounded-b-none for cards */
  roundedClass?: string;
  /** Show nav arrows only on parent group hover */
  arrowsOnHover?: boolean;
  onIndexChange?: (index: number) => void;
}

const placeholderImg = "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80";

export function ListingImageGallery({
  listingId,
  media,
  alt,
  placeholder = placeholderImg,
  aspectRatio = "4/3",
  className = "",
  onImageClick,
  showDots = true,
  showArrows = true,
  showCounter = true,
  roundedClass = "rounded-2xl",
  arrowsOnHover = false,
  onIndexChange,
}: ListingImageGalleryProps) {
  const photos = media
    .filter((m) => m.kind === "PHOTO")
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const items = photos.length > 0 ? photos : [{ asset_id: "placeholder", kind: "PHOTO", sort_order: 0 }];
  const current = items[currentIndex];
  const isPlaceholder = current?.asset_id === "placeholder" || imgErrors[current?.asset_id];
  const imgSrc = isPlaceholder ? placeholder : getListingMediaUrl(listingId, current.asset_id);

  const goTo = useCallback(
    (index: number) => {
      const next = (Math.max(0, Math.min(index, items.length - 1)) + items.length) % items.length;
      setCurrentIndex(next);
      onIndexChange?.(next);
    },
    [items.length, onIndexChange],
  );

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
    touchEnd.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStart.current == null || touchEnd.current == null) return;
    const diff = touchStart.current - touchEnd.current;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStart.current = null;
    touchEnd.current = null;
  }, [goPrev, goNext]);

  const handleImageError = useCallback(() => {
    if (current?.asset_id) setImgErrors((prev) => ({ ...prev, [current.asset_id]: true }));
  }, [current?.asset_id]);

  if (items.length === 0) return null;

  const aspectClass = {
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-video",
    "1/1": "aspect-square",
  }[aspectRatio];

  return (
    <div
      className={`relative overflow-hidden bg-nexa-bg ${aspectClass} ${roundedClass} ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        onClick={() => {
          if (current?.asset_id !== "placeholder" && !imgErrors[current?.asset_id]) {
            onImageClick?.(imgSrc);
          }
        }}
        className="block w-full h-full focus:outline-none focus:ring-0 cursor-pointer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={`${alt} — ${currentIndex + 1} of ${items.length}`}
          className="w-full h-full object-cover select-none"
          draggable={false}
          onError={handleImageError}
        />
      </button>

      {items.length > 1 && (
        <>
          {showArrows && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goPrev();
                }}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-nexa-ink transition-all",
                  arrowsOnHover ? "opacity-0 group-hover:opacity-100" : "hover:scale-110",
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goNext();
                }}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-nexa-ink transition-all",
                  arrowsOnHover ? "opacity-0 group-hover:opacity-100" : "hover:scale-110",
                )}
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {showDots && (
            <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1 pointer-events-none">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goTo(i);
                  }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all pointer-events-auto",
                    i === currentIndex ? "bg-white" : "bg-white/50 hover:bg-white/70",
                  )}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
      {items.length > 1 && showCounter && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/55 text-white text-[0.65rem] font-medium tabular-nums">
          {currentIndex + 1} / {items.length}
        </div>
      )}
    </div>
  );
}
