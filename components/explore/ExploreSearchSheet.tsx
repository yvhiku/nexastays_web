"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { SheetHeader } from "@/components/mobile/SheetHeader";
import { SearchSummary } from "@/components/search/SearchSummary";
import { DestinationSheet } from "@/components/search/DestinationSheet";
import { DateSheet } from "@/components/search/DateSheet";
import { GuestSheet } from "@/components/search/GuestSheet";
import { SEARCH_MOTION, nexaHaptic } from "@/components/search/SearchAnimations";
import type { SearchActiveStep } from "@/components/search/SearchState";
import {
  DEFAULT_SEARCH_BAR_VALUE,
  type SearchBarValue,
} from "@/components/search/types";
import { getExploreRecentSearches } from "@/lib/explore-recent-searches";
import { getCollectionsForContext } from "@/lib/explore-collections";
import { MOROCCO_CONTEXT } from "@/lib/explore-city-context";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  value: SearchBarValue;
  onSearch: (value: SearchBarValue) => void;
  onApplyRecent?: (entry: { city?: string; checkin?: string; checkout?: string; guests?: number; label: string }) => void;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
};

export function ExploreSearchSheet({
  open,
  onClose,
  value: initialValue,
  onSearch,
  onApplyRecent,
  t,
  tf,
  locale,
}: Props) {
  const [value, setValue] = useState<SearchBarValue>(initialValue);
  const [activeStep, setActiveStep] = useState<SearchActiveStep>(null);
  const [flashStep, setFlashStep] = useState<SearchActiveStep>(null);
  const [lastFocused, setLastFocused] = useState<Exclude<SearchActiveStep, null> | null>(null);
  const [enteredRoot, setEnteredRoot] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getExploreRecentSearches());

  const whereRef = useRef<HTMLButtonElement>(null);
  const whenRef = useRef<HTMLButtonElement>(null);
  const guestsRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      setActiveStep(null);
      setEnteredRoot(false);
      return;
    }
    setValue(initialValue);
    setRecentSearches(getExploreRecentSearches());
    const id = requestAnimationFrame(() => setEnteredRoot(true));
    return () => cancelAnimationFrame(id);
  }, [open, initialValue]);

  const patch = useCallback((partial: Partial<SearchBarValue>) => {
    setValue((prev) => ({ ...prev, ...partial }));
  }, []);

  const flash = useCallback((step: Exclude<SearchActiveStep, null>) => {
    setFlashStep(step);
    window.setTimeout(() => setFlashStep(null), SEARCH_MOTION.flashMs);
  }, []);

  const handleSearchStays = useCallback(() => {
    nexaHaptic(16);
    setActiveStep(null);
    onSearch(value);
  }, [onSearch, value]);

  const collections = getCollectionsForContext(value.city || undefined, 3);

  return (
    <>
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        height="summary"
        padded={false}
        zIndexClassName="z-[65]"
        ariaLabel={t("searchBar.searchMorocco")}
        closeOnEscape={activeStep === null}
        contentClassName={cn(
          "transition-[transform,opacity] duration-[220ms] ease-out",
          enteredRoot ? "scale-100 opacity-100" : "scale-[0.98] opacity-95",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader title={t("searchBar.searchMorocco")} onClose={onClose} />
          <SearchSummary
            value={value}
            locale={locale}
            t={t}
            tf={tf}
            flashStep={flashStep}
            lastFocused={activeStep === null ? lastFocused : null}
            onOpenStep={(step) => {
              setLastFocused(step);
              setActiveStep(step);
            }}
            onSearchStays={handleSearchStays}
            whereRef={whereRef}
            whenRef={whenRef}
            guestsRef={guestsRef}
          />
          {activeStep === null && (
            <div className="border-t border-nexa-line px-4 py-4 space-y-4 overflow-y-auto">
              {recentSearches.length > 0 && (
                <SuggestionSection title={t("searchSheet.recent")}>
                  {recentSearches.map((entry) => (
                    <SuggestionChip
                      key={`${entry.label}-${entry.searchedAt}`}
                      label={entry.label}
                      onClick={() => onApplyRecent?.(entry)}
                    />
                  ))}
                </SuggestionSection>
              )}
              <SuggestionSection title={t("searchSheet.popular")}>
                {MOROCCO_CONTEXT.popularCities.slice(0, 6).map((city) => (
                  <SuggestionChip
                    key={city}
                    label={city}
                    onClick={() =>
                      patch({ city, destinationId: city.toLowerCase() })
                    }
                  />
                ))}
              </SuggestionSection>
              {collections.length > 0 && (
                <SuggestionSection title={t("searchSheet.collections")}>
                  {collections.map((col) => (
                    <SuggestionChip
                      key={col.id}
                      label={t(col.titleKey)}
                      onClick={() => {
                        patch({
                          city: col.filters.city ?? value.city,
                          listingType: col.filters.listing_type?.toLowerCase() ?? "all",
                        });
                      }}
                    />
                  ))}
                </SuggestionSection>
              )}
            </div>
          )}
        </div>
      </BottomSheet>

      <DestinationSheet
        open={open && activeStep === "destination"}
        value={value}
        onPatch={patch}
        onClose={() => setActiveStep(null)}
        onSelected={() => {
          flash("destination");
          setLastFocused("dates");
          setActiveStep("dates");
        }}
        t={t}
      />
      <DateSheet
        open={open && activeStep === "dates"}
        value={value}
        locale={locale}
        onPatch={patch}
        onClose={() => setActiveStep(null)}
        onComplete={() => {
          flash("dates");
          setLastFocused("guests");
          setActiveStep("guests");
        }}
        t={t}
      />
      <GuestSheet
        open={open && activeStep === "guests"}
        value={value}
        onPatch={patch}
        onClose={() => setActiveStep(null)}
        onDone={() => {
          flash("guests");
          setLastFocused("guests");
          setActiveStep(null);
        }}
        t={t}
      />
    </>
  );
}

function SuggestionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wide text-nexa-ink-4">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SuggestionChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-nexa-line bg-white px-3.5 py-1.5 text-xs font-semibold text-nexa-ink-2 hover:border-nexa-primary hover:text-nexa-primary"
    >
      {label}
    </button>
  );
}
