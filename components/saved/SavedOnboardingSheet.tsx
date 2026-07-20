"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  markSavedOnboardingSeen,
  type SavedListingSnapshot,
} from "@/lib/saved-listings";
import { cn } from "@/lib/utils";

type Props = {
  snapshot: SavedListingSnapshot;
  onClose: () => void;
};

export function SavedOnboardingSheet({ snapshot, onClose }: Props) {
  const { t, localePath } = useLanguage();

  useEffect(() => {
    markSavedOnboardingSeen();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal
      aria-label={t("saved.onboardingTitle")}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px]",
          "border border-white/40 bg-white p-6 shadow-nexa-lg",
          "pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        )}
      >
        <div className="mx-auto mb-4 overflow-hidden rounded-2xl border border-nexa-line bg-nexa-bg-2">
          <div className="relative h-36 bg-nexa-bg-2">
            {snapshot.imageUrl ? (
              <Image
                src={snapshot.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="400px"
                unoptimized={snapshot.imageUrl.startsWith("http://")}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Bookmark className="h-10 w-10 text-nexa-primary/40" />
              </div>
            )}
            <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-nexa-primary shadow-sm">
              <Bookmark className="h-4 w-4 fill-nexa-primary" />
            </div>
          </div>
          <div className="p-3">
            <p className="line-clamp-1 text-sm font-semibold text-nexa-ink">{snapshot.title}</p>
            {snapshot.city ? (
              <p className="mt-0.5 text-xs text-nexa-ink-4">{snapshot.city}</p>
            ) : null}
          </div>
        </div>

        <h2 className="text-lg font-semibold text-nexa-ink">{t("saved.onboardingTitle")}</h2>
        <p className="mt-2 text-sm text-nexa-ink-3">{t("saved.onboardingBody")}</p>

        <Link
          href={localePath("/saved-listings")}
          onClick={onClose}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-nexa-primary text-sm font-semibold text-white"
        >
          {t("saved.browseSaved")}
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 flex h-11 w-full items-center justify-center text-sm font-medium text-nexa-ink-3"
        >
          {t("saved.continueExploring")}
        </button>
      </div>
    </div>
  );
}
