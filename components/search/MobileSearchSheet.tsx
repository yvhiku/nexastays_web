"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobileSearch } from "@/components/search/MobileSearchProvider";
import {
  DEFAULT_SEARCH_BAR_VALUE,
  SearchBar,
  pushRecentSearch,
  searchBarValueToParams,
  type SearchBarValue,
} from "@/components/search";
import { findDestinationById } from "@/lib/search-destinations";
import { cn } from "@/lib/utils";

export function MobileSearchSheet() {
  const { open, closeSearch } = useMobileSearch();
  const { t, tf, locale, localePath } = useLanguage();
  const router = useRouter();
  const [value, setValue] = useState<SearchBarValue>(DEFAULT_SEARCH_BAR_VALUE);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeSearch]);

  if (!open) return null;

  const onSearch = (next: SearchBarValue) => {
    const dest = findDestinationById(next.destinationId);
    if (dest) {
      pushRecentSearch({
        destinationId: dest.id,
        label: dest.label,
        city: dest.resolveCity,
      });
    }
    const params = searchBarValueToParams(next);
    closeSearch();
    router.push(localePath(`/listings?${params.toString()}`));
  };

  return (
    <div className="fixed inset-0 z-[65] md:hidden" role="dialog" aria-modal="true" aria-label={t("pwa.navSearch")}>
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t("common.close")}
        onClick={closeSearch}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[28px]",
          "border border-white/40 bg-white/95 backdrop-blur-2xl shadow-nexa-lg",
          "pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 px-4",
          "animate-in slide-in-from-bottom duration-[220ms]",
          "motion-reduce:animate-none",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-nexa-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-nexa-ink">{t("pwa.navSearch")}</h2>
          <button
            type="button"
            onClick={closeSearch}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-nexa-bg-2 active:scale-95"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5 text-nexa-ink-3" />
          </button>
        </div>
        <SearchBar
          value={value}
          onChange={setValue}
          onSearch={onSearch}
          t={t}
          tf={tf}
          locale={locale}
          variant="listings"
        />
      </div>
    </div>
  );
}
