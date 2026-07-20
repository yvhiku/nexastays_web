"use client";

import React from "react";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { SheetHeader } from "@/components/mobile/SheetHeader";
import { GuestsPanel } from "./GuestsField";
import { SearchProgress } from "./SearchProgress";
import { nexaHaptic } from "./SearchAnimations";
import type { SearchBarValue } from "./types";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  value: SearchBarValue;
  onPatch: (partial: Partial<SearchBarValue>) => void;
  onClose: () => void;
  onDone: () => void;
  t: (key: string) => string;
};

export function GuestSheet({
  open,
  value,
  onPatch,
  onClose,
  onDone,
  t,
}: Props) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      height="guests"
      zIndexClassName="z-[70]"
      ariaLabel={t("searchBar.whoComing")}
      padded={false}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <SearchProgress step="guests" />
        <SheetHeader
          title={t("searchBar.whoComing")}
          onBack={onClose}
          backLabel={t("pwa.navSearch")}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-0">
          <GuestsPanel
            value={value}
            onChange={onPatch}
            t={t}
            className="max-w-none p-1 sm:p-1"
          />
        </div>
        <div className="shrink-0 border-t border-nexa-line/60 bg-white/95 px-0 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="h-14 w-full rounded-full text-base font-bold"
            onClick={() => {
              nexaHaptic(12);
              onDone();
            }}
          >
            {t("searchBar.done")}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
