"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export type SavedToastState =
  | { kind: "saved" }
  | { kind: "collection" }
  | { kind: "removed"; listingId: string; onUndo: () => void };

type Props = {
  toast: SavedToastState | null;
  onDismiss: () => void;
};

export function SavedToast({ toast, onDismiss }: Props) {
  const { t, localePath } = useLanguage();
  if (!toast) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-[70] flex justify-center px-3 md:px-6",
        "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-6",
        "animate-in fade-in slide-in-from-bottom-3 duration-200",
      )}
      role="status"
    >
      <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-nexa-line bg-nexa-ink px-4 py-3 text-white shadow-nexa-md">
        {toast.kind === "removed" ? (
          <>
            <p className="text-sm font-medium">{t("saved.removed")}</p>
            <button
              type="button"
              className="shrink-0 text-sm font-semibold text-nexa-primary-soft"
              onClick={() => {
                toast.onUndo();
                onDismiss();
              }}
            >
              {t("saved.undo")}
            </button>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2 text-sm font-medium">
              {toast.kind === "saved" ? (
                <Check className="h-4 w-4 text-green-300" aria-hidden />
              ) : null}
              {toast.kind === "collection"
                ? t("saved.collectionToast")
                : t("saved.savedToast")}
            </p>
            <Link
              href={localePath("/saved-listings")}
              onClick={onDismiss}
              className="shrink-0 text-sm font-semibold text-[#FF7D9D]"
            >
              {toast.kind === "collection" ? t("saved.seeSaved") : t("saved.viewSaved")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
