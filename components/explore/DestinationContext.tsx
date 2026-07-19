"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  getCityContextByCity,
  MOROCCO_CONTEXT,
  slugifyNeighborhood,
} from "@/lib/explore-city-context";

export type DestinationContextProps = {
  city: string;
  neighborhood?: string;
  resultNeighborhoods?: string[];
  neighborhoodCount?: number;
  matchCount?: number;
  onSelectNeighborhood: (neighborhood: string | null) => void;
  onSelectCity: (city: string) => void;
  t: (key: string) => string;
  tf?: (key: string, vars?: Record<string, string | number>) => string;
  className?: string;
};

export function DestinationContext({
  city,
  neighborhood,
  resultNeighborhoods = [],
  neighborhoodCount,
  matchCount,
  onSelectNeighborhood,
  onSelectCity,
  t,
  tf,
  className,
}: DestinationContextProps) {
  const ctx = getCityContextByCity(city);

  const chips = React.useMemo(() => {
    if (!ctx) return [];
    const set = new Set<string>([
      ...ctx.neighborhoods.map((n) => n.name),
      ...resultNeighborhoods.filter(Boolean),
    ]);
    return Array.from(set);
  }, [ctx, resultNeighborhoods]);

  if (!city) {
    return (
      <section className={cn("mb-6 sm:mb-7 min-w-0", className)}>
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-nexa-ink mb-1">
          {t(MOROCCO_CONTEXT.titleKey)}
        </h1>
        <p className="text-sm text-nexa-ink-3 mb-4 max-w-2xl">
          {t(MOROCCO_CONTEXT.subtitleKey)}
        </p>
        <div className="flex flex-wrap gap-2">
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
      </section>
    );
  }

  const title = ctx
    ? t(ctx.titleKey)
    : tf
      ? tf("explore.cityGenericTitle", { city })
      : t("explore.cityGenericTitle").replace("{city}", city);
  const subtitle = ctx ? t(ctx.subtitleKey) : t("explore.cityGenericSubtitle");

  return (
    <section className={cn("mb-6 sm:mb-7 min-w-0", className)}>
      <h1 className="font-display text-xl sm:text-2xl font-semibold text-nexa-ink mb-1">
        {title}
      </h1>
      <p className="text-sm text-nexa-ink-3 mb-3 max-w-2xl">{subtitle}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-nexa-ink-4 mb-4">
        {matchCount != null && (
          <span>
            {matchCount} {t("explore.staysWord")}
          </span>
        )}
        {neighborhoodCount != null && neighborhoodCount > 0 && (
          <span>
            {neighborhoodCount} {t("explore.neighborhoodsWord")}
          </span>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((n) => {
            const selected =
              neighborhood &&
              slugifyNeighborhood(neighborhood) === slugifyNeighborhood(n);
            return (
              <button
                type="button"
                key={n}
                aria-pressed={Boolean(selected)}
                onClick={() =>
                  onSelectNeighborhood(selected ? null : n)
                }
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  selected
                    ? "border-nexa-primary bg-nexa-primary-soft text-nexa-primary"
                    : "border-nexa-line bg-white text-nexa-ink-2 hover:border-nexa-primary hover:text-nexa-primary",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
