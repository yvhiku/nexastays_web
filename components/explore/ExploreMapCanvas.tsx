"use client";

import React, { useMemo } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCityContextByCity,
  MOROCCO_CONTEXT,
  slugifyNeighborhood,
  viewportAvgPrice,
  type ExploreNeighborhood,
} from "@/lib/explore-city-context";
import type { StaysListing } from "@/lib/stays-types";

export type ExploreMapCanvasHeaderProps = {
  city: string;
  neighborhood?: string;
  listings: StaysListing[];
  onSelectNeighborhood: (neighborhood: string | null) => void;
  onSelectCity: (city: string) => void;
  onClearCity: () => void;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  className?: string;
};

function descriptorIcon(descriptorKey: string): string {
  if (descriptorKey.includes("Beach")) return "🌊";
  if (descriptorKey.includes("Historic")) return "🏛";
  if (descriptorKey.includes("Shopping")) return "📍";
  if (descriptorKey.includes("Nature")) return "🌿";
  if (descriptorKey.includes("Luxury")) return "✨";
  if (descriptorKey.includes("Business")) return "🏢";
  return "📍";
}

function DestinationChip({
  neighborhood,
  selected,
  onClick,
  t,
}: {
  neighborhood: ExploreNeighborhood;
  selected: boolean;
  onClick: () => void;
  t: (key: string) => string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex flex-col items-start gap-0.5 rounded-2xl border px-3.5 py-2 text-left transition-colors",
        selected
          ? "border-nexa-primary bg-nexa-primary-soft"
          : "border-nexa-line bg-white hover:border-nexa-primary/50",
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-nexa-ink">
        <span aria-hidden>{descriptorIcon(neighborhood.descriptorKey)}</span>
        {neighborhood.name}
        {selected && (
          <X className="h-3 w-3 text-nexa-primary ms-0.5" aria-hidden />
        )}
      </span>
      <span className="text-[0.65rem] text-nexa-ink-4 ps-5">
        {t(neighborhood.descriptorKey)}
      </span>
    </button>
  );
}

/** Destination framing above the Explore map (Discover Morocco → Explore City). */
export function ExploreMapCanvasHeader({
  city,
  neighborhood,
  listings,
  onSelectNeighborhood,
  onSelectCity,
  onClearCity,
  t,
  tf,
  className,
}: ExploreMapCanvasHeaderProps) {
  const ctx = getCityContextByCity(city);
  const avg = useMemo(() => viewportAvgPrice(listings), [listings]);
  const allAreasSelected = !neighborhood;

  if (!city) {
    return (
      <header className={cn("mb-5 min-w-0", className)}>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-nexa-ink tracking-tight">
          {t("explore.discoverMorocco")}
        </h2>
        <p className="mt-1 text-sm text-nexa-ink-3 max-w-xl">
          {t("explore.mapDiscoverSubtitle")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {MOROCCO_CONTEXT.popularCities.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => onSelectCity(c)}
              className="rounded-full border border-nexa-line bg-white px-3.5 py-1.5 text-xs font-semibold text-nexa-ink-2 hover:border-nexa-primary hover:text-nexa-primary transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
        <div className="hidden" aria-hidden data-nexa-recommended-slot />
      </header>
    );
  }

  return (
    <header className={cn("mb-5 min-w-0", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-nexa-ink-4 mb-1">
            {t("explore.exploreLabel")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-nexa-ink tracking-tight inline-block">
            <span className="relative inline-block pb-1">
              {city}
              <span
                className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-nexa-primary to-nexa-primary/40"
                aria-hidden
              />
            </span>
          </h2>
          {ctx?.taglineKey && (
            <p className="mt-2 text-sm text-nexa-ink-3">{t(ctx.taglineKey)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClearCity}
          className="shrink-0 text-xs font-semibold text-nexa-ink-4 hover:text-nexa-primary transition-colors underline-offset-2 hover:underline"
        >
          {t("explore.clearCity")}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-nexa-ink-3">
        <span className="inline-flex items-center gap-1.5 font-medium text-nexa-ink">
          <span
            className="h-1.5 w-1.5 rounded-full bg-nexa-primary"
            aria-hidden
          />
          {tf("explore.staysInArea", { count: listings.length })}
        </span>
        {avg && (
          <span className="text-nexa-ink-4">
            {tf("explore.avgInArea", {
              price: avg.avg,
              currency: avg.currency,
            })}
          </span>
        )}
      </div>

      {ctx && ctx.neighborhoods.length > 0 && (
        <div className="mt-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-nexa-ink-4 mb-2">
            {t("explore.popularAreas")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={allAreasSelected}
              onClick={() => {
                if (allAreasSelected) {
                  onClearCity();
                } else {
                  onSelectNeighborhood(null);
                }
              }}
              className={cn(
                "inline-flex flex-col items-start gap-0.5 rounded-2xl border px-3.5 py-2 text-left transition-colors",
                allAreasSelected
                  ? "border-nexa-primary bg-nexa-primary-soft"
                  : "border-nexa-line bg-white hover:border-nexa-primary/50",
              )}
            >
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-nexa-ink">
                {tf("explore.allInCity", { city })}
                {allAreasSelected && (
                  <X className="h-3 w-3 text-nexa-primary" aria-hidden />
                )}
              </span>
              <span className="text-[0.65rem] text-nexa-ink-4">
                {t("explore.allAreas")}
              </span>
            </button>
            {ctx.neighborhoods.map((n) => {
              const selected =
                Boolean(neighborhood) &&
                slugifyNeighborhood(neighborhood!) ===
                  slugifyNeighborhood(n.name);
              return (
                <DestinationChip
                  key={n.name}
                  neighborhood={n}
                  selected={selected}
                  onClick={() =>
                    onSelectNeighborhood(selected ? null : n.name)
                  }
                  t={t}
                />
              );
            })}
          </div>
        </div>
      )}

      <div
        className="mt-3 hidden min-h-0"
        aria-hidden
        data-nexa-recommended-slot
      />
    </header>
  );
}

export type ExploreMapCanvasProps = ExploreMapCanvasHeaderProps & {
  children: React.ReactNode;
};

/** Header + map shell for map layout. */
export function ExploreMapCanvas({
  children,
  ...headerProps
}: ExploreMapCanvasProps) {
  return (
    <section className="min-w-0">
      <ExploreMapCanvasHeader {...headerProps} />
      {children}
    </section>
  );
}
