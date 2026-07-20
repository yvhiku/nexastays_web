"use client";

import React from "react";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { SheetHeader } from "@/components/mobile/SheetHeader";
import { DateRangePanel } from "./DateRangeField";
import { SearchProgress } from "./SearchProgress";
import { nexaHaptic } from "./SearchAnimations";
import type { SearchBarValue } from "./types";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  open: boolean;
  value: SearchBarValue;
  locale: string;
  onPatch: (partial: Partial<SearchBarValue>) => void;
  onClose: () => void;
  onComplete: () => void;
  t: (key: string) => string;
};

export function DateSheet({
  open,
  value,
  locale,
  onPatch,
  onClose,
  onComplete,
  t,
}: Props) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      height="full"
      zIndexClassName="z-[70]"
      ariaLabel={t("searchBar.whenQuestion")}
      padded
    >
      <SearchProgress step="dates" />
      <SheetHeader
        title={t("searchBar.whenQuestion")}
        onBack={onClose}
        backLabel={t("pwa.navSearch")}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <DateRangePanel
          checkin={value.checkin}
          checkout={value.checkout}
          onChange={({ checkin, checkout }) => onPatch({ checkin, checkout })}
          onComplete={() => {
            nexaHaptic(14);
            onComplete();
          }}
          min={todayISO()}
          locale={locale}
          clearLabel={t("home.search.clearDate")}
          className="p-0 sm:p-0"
        />
      </div>
    </BottomSheet>
  );
}
