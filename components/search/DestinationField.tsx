"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  filterDestinations,
  POPULAR_DESTINATIONS,
  type SearchDestination,
} from "@/lib/search-destinations";
import { getRecentSearches } from "./search-recent";
import { STAY_TYPE_OPTIONS } from "./types";

type TFn = (key: string) => string;

export type DestinationPanelProps = {
  query: string;
  onQueryChange: (q: string) => void;
  listingType: string;
  onSelectDestination: (dest: SearchDestination) => void;
  onListingTypeChange: (type: string) => void;
  t: TFn;
  className?: string;
};

function stayTypeLabel(type: string, t: TFn): string {
  if (type === "all") return t("searchBar.stayAny");
  return t(`searchBar.stay.${type}` as "searchBar.stay.APARTMENT");
}

function DestRow({
  dest,
  subtitle,
  onSelect,
}: {
  dest: SearchDestination;
  subtitle: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-nexa-primary-soft transition-colors"
    >
      <span className="mt-0.5 h-9 w-9 rounded-xl bg-nexa-bg-2 border border-nexa-line flex items-center justify-center shrink-0">
        <MapPin className="h-4 w-4 text-nexa-primary" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-nexa-ink truncate">
          {dest.label}
        </span>
        <span className="block text-xs text-nexa-ink-4 truncate">{subtitle}</span>
      </span>
    </button>
  );
}

export function DestinationPanel({
  query,
  onQueryChange,
  listingType,
  onSelectDestination,
  onListingTypeChange,
  t,
  className,
}: DestinationPanelProps) {
  const [recent, setRecent] = useState(() => getRecentSearches());

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  const filtered = useMemo(() => filterDestinations(query), [query]);
  const showBrowse = !query.trim();

  const subtitleFor = (dest: SearchDestination) =>
    t(`searchBar.destSubtitles.${dest.subtitleKey}`);

  return (
    <div className={cn("p-4 sm:p-5 w-full max-w-md", className)}>
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nexa-ink-4"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t("searchBar.searchMorocco")}
          className="w-full h-11 rounded-xl border border-nexa-line bg-nexa-bg-2 pl-10 pr-3 text-sm text-nexa-ink outline-none focus:border-nexa-primary focus:ring-2 focus:ring-nexa-primary/20"
          autoFocus
        />
      </div>

      <div className="mb-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-2">
          {t("searchBar.stayType")}
        </p>
        <div className="flex flex-wrap gap-2">
          {STAY_TYPE_OPTIONS.map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => onListingTypeChange(type)}
              className={cn(
                "py-1.5 px-3.5 rounded-full text-[0.78rem] border transition-all font-medium",
                listingType === type
                  ? "border-nexa-primary text-nexa-primary bg-nexa-primary-soft"
                  : "border-nexa-line text-nexa-ink-3 hover:border-nexa-primary",
              )}
            >
              {stayTypeLabel(type, t)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[280px] overflow-y-auto -mx-1 px-1 space-y-4">
        {showBrowse && recent.length > 0 && (
          <section>
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-1.5 px-1">
              {t("searchBar.recent")}
            </p>
            {recent.map((r) => {
              const dest =
                filtered.find((d) => d.id === r.destinationId) ??
                ({
                  id: r.destinationId,
                  label: r.label,
                  subtitleKey: "city",
                  resolveCity: r.city,
                } satisfies SearchDestination);
              return (
                <DestRow
                  key={r.destinationId}
                  dest={dest}
                  subtitle={r.city}
                  onSelect={() => onSelectDestination(dest)}
                />
              );
            })}
          </section>
        )}

        {showBrowse && (
          <section>
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-1.5 px-1">
              {t("searchBar.popular")}
            </p>
            {POPULAR_DESTINATIONS.map((dest) => (
              <DestRow
                key={dest.id}
                dest={dest}
                subtitle={subtitleFor(dest)}
                onSelect={() => onSelectDestination(dest)}
              />
            ))}
          </section>
        )}

        <section>
          <p className="text-[0.7rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-1.5 px-1">
            {showBrowse ? t("searchBar.allDestinations") : t("searchBar.results")}
          </p>
          {(showBrowse ? filtered : filtered).slice(0, showBrowse ? 12 : 20).map((dest) => (
            <DestRow
              key={dest.id}
              dest={dest}
              subtitle={
                dest.resolveCity !== dest.label
                  ? dest.resolveCity
                  : subtitleFor(dest)
              }
              onSelect={() => onSelectDestination(dest)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-nexa-ink-4 px-3 py-4">{t("searchBar.noDestinations")}</p>
          )}
        </section>
      </div>
    </div>
  );
}

export { stayTypeLabel };
