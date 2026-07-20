"use client";

import React, { useState } from "react";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { SheetHeader } from "@/components/mobile/SheetHeader";
import { DestinationPanel } from "./DestinationField";
import { SearchProgress } from "./SearchProgress";
import { nexaHaptic } from "./SearchAnimations";
import type { SearchBarValue } from "./types";
import type { SearchDestination } from "@/lib/search-destinations";

type Props = {
  open: boolean;
  value: SearchBarValue;
  onPatch: (partial: Partial<SearchBarValue>) => void;
  onClose: () => void;
  onSelected: () => void;
  t: (key: string) => string;
};

export function DestinationSheet({
  open,
  value,
  onPatch,
  onClose,
  onSelected,
  t,
}: Props) {
  const [destQuery, setDestQuery] = useState("");

  const onSelect = (d: SearchDestination) => {
    onPatch({ destinationId: d.id, city: d.resolveCity });
    setDestQuery("");
    nexaHaptic(14);
    onSelected();
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      height="full"
      zIndexClassName="z-[70]"
      ariaLabel={t("searchBar.whereAreYouGoing")}
      padded
    >
      <SearchProgress step="destination" />
      <SheetHeader
        title={t("searchBar.whereAreYouGoing")}
        onBack={onClose}
        backLabel={t("pwa.navSearch")}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <DestinationPanel
          query={destQuery}
          onQueryChange={setDestQuery}
          listingType={value.listingType}
          onSelectDestination={onSelect}
          onListingTypeChange={(listingType) => onPatch({ listingType })}
          t={t}
          className="max-w-none p-0 sm:p-0"
        />
      </div>
    </BottomSheet>
  );
}
