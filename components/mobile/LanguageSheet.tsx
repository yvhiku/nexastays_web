"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { LOCALES, type Locale } from "@/lib/i18n";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { SheetHeader } from "@/components/mobile/SheetHeader";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LanguageSheet({ open, onOpenChange }: Props) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={t("common.language")}
      zIndexClassName="z-[80]"
    >
      <SheetHeader title={t("common.language")} onClose={() => onOpenChange(false)} />
      <ul className="space-y-1 pb-2" role="listbox" aria-label={t("common.language")}>
        {LOCALES.map(({ code, name, native }) => {
          const selected = locale === code;
          return (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setLocale(code as Locale);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex w-full min-h-[48px] items-center justify-between rounded-xl px-4 py-3 text-start text-sm transition-colors active:scale-[0.99]",
                  selected
                    ? "bg-nexa-primary-soft font-semibold text-nexa-primary"
                    : "text-nexa-ink hover:bg-nexa-bg-2",
                )}
              >
                <span>
                  <span className="font-medium">{native}</span>
                  {native !== name ? (
                    <span className="ms-1.5 text-xs text-nexa-ink-4">({name})</span>
                  ) : null}
                </span>
                <span className="text-xs font-semibold tracking-wide text-nexa-ink-4">
                  {code.toUpperCase()}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
