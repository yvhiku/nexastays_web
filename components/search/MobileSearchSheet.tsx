"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { SheetHeader } from "@/components/mobile/SheetHeader";

export function MobileSearchSheet() {
  const { open, closeSearch } = useMobileSearch();
  const { t, tf, locale, localePath } = useLanguage();
  const router = useRouter();
  const [value, setValue] = useState<SearchBarValue>(DEFAULT_SEARCH_BAR_VALUE);

  useEffect(() => {
    if (!open) setValue(DEFAULT_SEARCH_BAR_VALUE);
  }, [open]);

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
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) closeSearch();
      }}
      ariaLabel={t("pwa.navSearch")}
    >
      <SheetHeader title={t("pwa.navSearch")} onClose={closeSearch} />
      <SearchBar
        value={value}
        onChange={setValue}
        onSearch={onSearch}
        t={t}
        tf={tf}
        locale={locale}
        variant="listings"
      />
    </BottomSheet>
  );
}
