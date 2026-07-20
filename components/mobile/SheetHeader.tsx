"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  title: string;
  onClose?: () => void;
  className?: string;
};

export function SheetHeader({ title, onClose, className }: Props) {
  const { t } = useLanguage();
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <h2 className="text-base font-semibold text-nexa-ink">{title}</h2>
      {onClose ? (
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
  );
}
