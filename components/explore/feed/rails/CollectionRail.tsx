"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CollectionRailData } from "../types";
import type { ExploreCollection } from "@/lib/explore-collections";

type Props = {
  data: CollectionRailData;
  title?: string;
  subtitle?: string;
  onSelect: (collection: ExploreCollection | null) => void;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  className?: string;
};

export function CollectionRail({
  data,
  title,
  subtitle,
  onSelect,
  t,
  tf,
  className,
}: Props) {
  const { collections, activeId, stayCounts } = data;
  if (collections.length < 2) return null;

  const resolvedTitle = title ?? t("explore.collectionsTitle");
  const resolvedSubtitle = subtitle ?? t("explore.collectionsSubtitle");

  return (
    <section className={cn("mb-6 min-w-0", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-nexa-ink mb-0.5">
            {resolvedTitle}
          </h2>
          {resolvedSubtitle && (
            <p className="text-[0.8rem] text-nexa-ink-4">{resolvedSubtitle}</p>
          )}
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
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {collections.map((col) => {
          const selected = activeId === col.id;
          const count =
            stayCounts?.[col.id] ??
            (col.filters.city ? 120 : 80);
          return (
            <button
              type="button"
              key={col.id}
              aria-pressed={selected}
              onClick={() => onSelect(selected ? null : col)}
              className={cn(
                "group relative h-[108px] w-[152px] shrink-0 overflow-hidden rounded-xl text-left shadow-sm transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 sm:h-[88px] sm:w-auto",
                selected &&
                  "ring-2 ring-nexa-primary ring-offset-2 ring-offset-nexa-bg",
              )}
            >
              <Image
                src={col.image}
                alt={t(col.titleKey)}
                fill
                sizes="152px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                style={{ objectPosition: col.objectPosition ?? "center" }}
              />
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-nexa-ink/80 via-nexa-ink/30 to-transparent",
                  selected && "from-nexa-primary/70 via-nexa-ink/30",
                )}
                aria-hidden
              />
              <div className="absolute bottom-2 left-2 right-2">
                <span className="block text-white text-[0.72rem] font-bold leading-tight drop-shadow-md line-clamp-2">
                  {t(col.titleKey)}
                </span>
                <span className="mt-0.5 block text-[0.65rem] font-medium text-white/90">
                  {tf("explore.collectionStaysCount", { count })}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
