"use client";

import React from "react";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  title: string;
  onClose?: () => void;
  /** Prefer back chevron + label instead of X */
  onBack?: () => void;
  backLabel?: string;
  /** Trailing action (e.g. Done) */
  action?: React.ReactNode;
  className?: string;
};

export function SheetHeader({
  title,
  onClose,
  onBack,
  backLabel,
  action,
  className,
}: Props) {
  const { t } = useLanguage();
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-2", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-[44px] items-center gap-1 rounded-full pe-2 ps-1 text-sm font-semibold text-nexa-ink-3 hover:bg-nexa-bg-2 active:scale-95"
            aria-label={backLabel ?? t("common.back")}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
            {backLabel ? <span className="truncate">{backLabel}</span> : null}
          </button>
        ) : null}
        <h2 className="truncate text-base font-semibold text-nexa-ink">{title}</h2>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {action}
        {onClose && !onBack ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-nexa-bg-2 active:scale-95"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5 text-nexa-ink-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
