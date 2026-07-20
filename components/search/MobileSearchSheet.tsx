"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobileSearch } from "@/components/search/MobileSearchProvider";
import { pushRecentSearch } from "./search-recent";
import { searchBarValueToParams } from "./search-url";
import type { SearchBarValue } from "./types";
import { findDestinationById } from "@/lib/search-destinations";
import { SearchFlow } from "./SearchFlow";

export function MobileSearchSheet() {
  const { open, closeSearch } = useMobileSearch();
  const { t, tf, locale, localePath } = useLanguage();
  const router = useRouter();

  const onSearch = (next: SearchBarValue) => {
    const dest = findDestinationById(next.destinationId);
    if (dest) {
      pushRecentSearch({
        destinationId: dest.id,
        label: dest.label,
        city: dest.resolveCity,
      });
    } else if (next.city.trim()) {
      pushRecentSearch({
        destinationId: next.city.trim().toLowerCase(),
        label: next.city.trim(),
        city: next.city.trim(),
      });
    }
    const params = searchBarValueToParams(next);
    closeSearch();
    router.push(localePath(`/listings?${params.toString()}`));
  };

  return (
    <SearchFlow
      open={open}
      onClose={closeSearch}
      onSearch={onSearch}
      t={t}
      tf={tf}
      locale={locale}
    />
  );
}
