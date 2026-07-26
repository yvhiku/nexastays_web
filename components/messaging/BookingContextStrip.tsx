"use client";

import React from "react";
import { Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PremiumTooltip } from "./PremiumTooltip";

type Props = {
  onOpenContext: () => void;
};

export function BookingContextStrip({
  onOpenContext,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <PremiumTooltip label={t("inbox.context.open")}>
        <button
          type="button"
          onClick={onOpenContext}
          className="flex h-11 w-11 items-center justify-center rounded-full text-nexa-primary transition-[background-color,transform] duration-150 hover:bg-nexa-primary-soft active:scale-95 motion-reduce:transition-none lg:h-10 lg:w-10"
          aria-label={t("inbox.context.open")}
        >
          <Info className="h-[18px] w-[18px]" aria-hidden />
        </button>
      </PremiumTooltip>
    </div>
  );
}
