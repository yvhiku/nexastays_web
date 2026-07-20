"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSheet } from "@/components/mobile/LanguageSheet";

type Props = {
  className?: string;
};

/** Compact locale chip for the mobile top bar — EN / FR / AR, no globe. */
export function LanguagePill({ className }: Props) {
  const { locale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const label = locale.toUpperCase();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 min-w-[2.5rem] items-center justify-center rounded-full",
          "border border-nexa-line bg-white/80 px-2.5 text-xs font-semibold tracking-wide text-nexa-ink",
          "hover:border-nexa-primary/40 hover:text-nexa-primary active:scale-95",
          "xl:hidden",
          className,
        )}
        aria-label={t("common.language")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {label}
      </button>
      <LanguageSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
