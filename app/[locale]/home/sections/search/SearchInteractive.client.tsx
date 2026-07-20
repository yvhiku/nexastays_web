"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_SEARCH_BAR_VALUE,
  SearchBar,
  pushRecentSearch,
  searchBarValueToParams,
  type SearchBarValue,
} from "@/components/search";
import { findDestinationById } from "@/lib/search-destinations";
import { useLanguage } from "@/contexts/LanguageContext";

export const SearchSection = () => {
  const { t, tf, locale, localePath } = useLanguage();
  const router = useRouter();
  const [value, setValue] = useState<SearchBarValue>(DEFAULT_SEARCH_BAR_VALUE);

  const navigateWith = (next: SearchBarValue, extra?: { verified?: boolean }) => {
    const dest = findDestinationById(next.destinationId);
    if (dest) {
      pushRecentSearch({
        destinationId: dest.id,
        label: dest.label,
        city: dest.resolveCity,
      });
    }
    const params = searchBarValueToParams(next, {
      verified: extra?.verified,
    });
    router.push(localePath(`/listings?${params.toString()}`));
  };

  return (
    <section className="py-10 sm:py-14 md:py-16 bg-nexa-bg-2 border-b border-nexa-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <SearchBar
          value={value}
          onChange={setValue}
          onSearch={(v) => navigateWith(v)}
          t={t}
          tf={tf}
          locale={locale}
          variant="home"
        />
        <p className="text-center text-sm text-nexa-ink-4 max-w-[640px] mx-auto mt-4">
          {t("home.search.helperText")}
        </p>
        <div className="flex gap-2.5 flex-wrap justify-center mt-5">
          <button
            type="button"
            onClick={() => navigateWith(value, { verified: true })}
            className="rounded-full py-1.5 px-4 text-sm font-medium border border-nexa-line text-nexa-ink-3 hover:border-nexa-primary hover:text-nexa-primary hover:bg-nexa-primary-soft transition-colors"
          >
            ✓ {t("home.search.verifiedHosts")}
          </button>
          <button
            type="button"
            onClick={() => navigateWith(value)}
            className="rounded-full py-1.5 px-4 text-sm font-medium border border-nexa-line text-nexa-ink-3 hover:border-nexa-primary hover:text-nexa-primary hover:bg-nexa-primary-soft transition-colors"
          >
            📋 {t("home.search.controlledListings")}
          </button>
        </div>
      </div>
    </section>
  );
};
