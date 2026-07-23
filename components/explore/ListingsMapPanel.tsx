"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { StaysListing } from "@/lib/stays-types";
import { ExploreMap, type ExploreMapHandle } from "@/components/explore/ExploreMap";
import { ExploreMapCanvas } from "@/components/explore/ExploreMapCanvas";

export type ListingsMapPanelProps = {
  variant: "full" | "panel";
  showHeader: boolean;
  mapRef: React.RefObject<ExploreMapHandle | null>;
  listings: StaysListing[];
  localePath: (path: string) => string;
  checkin?: string;
  checkout?: string;
  guests?: number;
  city: string;
  neighborhood?: string;
  mapLoading: boolean;
  isRevalidating: boolean;
  onSelectNeighborhood: (neighborhood: string | null) => void;
  onSelectCity: (city: string) => void;
  onClearCity: () => void;
  onBoundsChange: (bounds: import("@/lib/stays-types").MapBounds) => void;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  labels: {
    loading: string;
    emptyTitle: string;
    emptyMessage: string;
    viewStay: string;
    exploreThisArea: string;
    myLocation: string;
    resetView: string;
    zoomOut: string;
    currentlyExploring: string;
    staysWord: string;
    exploreCity: string;
  };
  className?: string;
};

export function ListingsMapPanel({
  variant,
  showHeader,
  mapRef,
  listings,
  localePath,
  checkin,
  checkout,
  guests,
  city,
  neighborhood,
  mapLoading,
  isRevalidating,
  onSelectNeighborhood,
  onSelectCity,
  onClearCity,
  onBoundsChange,
  t,
  tf,
  labels,
  className,
}: ListingsMapPanelProps) {
  const map = (
    <ExploreMap
      ref={mapRef}
      listings={listings}
      localePath={localePath}
      checkin={checkin}
      checkout={checkout}
      guests={guests}
      city={city}
      preferListingsCenter={Boolean(city)}
      sizeVariant={variant === "panel" ? "panel" : "default"}
      emptyTitle={labels.emptyTitle}
      emptyMessage={labels.emptyMessage}
      viewStayLabel={labels.viewStay}
      exploreThisAreaLabel={labels.exploreThisArea}
      myLocationLabel={labels.myLocation}
      resetViewLabel={labels.resetView}
      zoomOutLabel={labels.zoomOut}
      currentlyExploringLabel={labels.currentlyExploring}
      staysWord={labels.staysWord}
      exploreCityLabel={labels.exploreCity}
      onBoundsChange={onBoundsChange}
      onSelectCity={onSelectCity}
    />
  );

  return (
    <div
      className={cn(
        "min-w-0 relative",
        variant === "panel" ? "h-full" : "mb-9",
        className,
      )}
      aria-busy={isRevalidating || mapLoading}
    >
      {(mapLoading || isRevalidating) && (
        <p className="absolute left-3 top-3 z-[460] rounded-lg bg-white/95 px-2.5 py-1 text-[0.7rem] font-medium text-nexa-ink-4 shadow-sm inline-flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full border-2 border-nexa-primary border-t-transparent animate-spin"
            aria-hidden
          />
          {labels.loading}
        </p>
      )}
      {showHeader ? (
        <ExploreMapCanvas
          city={city}
          neighborhood={neighborhood}
          listings={listings}
          onSelectNeighborhood={onSelectNeighborhood}
          onSelectCity={onSelectCity}
          onClearCity={onClearCity}
          t={t}
          tf={tf}
        >
          {map}
        </ExploreMapCanvas>
      ) : (
        map
      )}
    </div>
  );
}
