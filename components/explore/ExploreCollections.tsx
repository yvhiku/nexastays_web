"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  EXPLORE_COLLECTIONS,
  type ExploreCollection,
} from "@/lib/explore-collections";

export type ExploreCollectionsProps = {
  activeId: string | null;
  onSelect: (collection: ExploreCollection | null) => void;
  t: (key: string) => string;
  className?: string;
};

export function ExploreCollections({
  activeId,
  onSelect,
  t,
  className,
}: ExploreCollectionsProps) {
  return (
    <section className={cn("mb-7 min-w-0 w-0 min-w-full max-w-full", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-nexa-ink mb-0.5">
            {t("explore.collectionsTitle")}
          </h2>
          <p className="text-[0.8rem] text-nexa-ink-4">
            {t("explore.collectionsSubtitle")}
          </p>
        </div>
        {activeId && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="shrink-0 text-xs font-semibold text-nexa-primary hover:text-nexa-primary-dark"
          >
            {t("explore.clearCollection")}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {EXPLORE_COLLECTIONS.map((col) => {
          const selected = activeId === col.id;
          return (
            <button
              type="button"
              key={col.id}
              aria-pressed={selected}
              onClick={() => onSelect(selected ? null : col)}
              className={cn(
                "group relative w-full h-[80px] sm:h-[88px] rounded-xl overflow-hidden cursor-pointer shadow-sm text-left transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40",
                selected &&
                  "ring-2 ring-nexa-primary ring-offset-2 ring-offset-nexa-bg",
              )}
            >
              <Image
                src={col.image}
                alt={t(col.titleKey)}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 160px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                style={{ objectPosition: col.objectPosition ?? "center" }}
              />
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-nexa-ink/75 via-nexa-ink/25 to-transparent",
                  selected && "from-nexa-primary/70 via-nexa-ink/30",
                )}
                aria-hidden
              />
              <span className="absolute bottom-2 left-2 right-2 text-white text-[0.72rem] sm:text-[0.78rem] font-bold leading-tight drop-shadow-md line-clamp-2">
                {t(col.titleKey)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
