"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SAVE_TOAST_EVENT, type SaveToastDetail } from "@/lib/save-toast";
import { cn } from "@/lib/utils";

const TOAST_MS = 3200;

type ToastState = { message: string } | null;

export function SaveToastHost() {
  const { t } = useLanguage();
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const onSaveToast = (event: Event) => {
      const detail = (event as CustomEvent<SaveToastDetail>).detail;
      const message = detail?.message?.trim() || t("common.changesSaved");
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setToast({ message });
      timerRef.current = window.setTimeout(() => setToast(null), TOAST_MS);
    };

    window.addEventListener(SAVE_TOAST_EVENT, onSaveToast);
    return () => {
      window.removeEventListener(SAVE_TOAST_EVENT, onSaveToast);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [t]);

  if (!toast) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-[75] flex justify-center px-3 md:px-6 pointer-events-none",
        "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-6",
        "animate-in fade-in slide-in-from-bottom-3 duration-200",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-sm items-center gap-2.5 rounded-2xl border border-nexa-line bg-nexa-ink px-4 py-3 text-white shadow-nexa-md">
        <Check className="h-4 w-4 shrink-0 text-green-300" aria-hidden />
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
}
