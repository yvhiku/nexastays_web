"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { DestinationRailData } from "../types";

type Props = {
  data: DestinationRailData;
  title?: string;
  onSelectCity: (city: string) => void;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  className?: string;
};

export function DestinationRail({
  data,
  title,
  onSelectCity,
  t,
  tf,
  className,
}: Props) {
  const { cities } = data;
  if (cities.length < 3) return null;

  return (
    <section className={cn("mb-6 min-w-0", className)}>
      <h2 className="mb-3 font-display text-base font-semibold text-nexa-ink">
        {title ?? t("explore.destinationsTitle")}
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {cities.map((dest) => (
          <button
            type="button"
            key={dest.city}
            onClick={() => onSelectCity(dest.city)}
            className="group relative h-[96px] overflow-hidden rounded-xl text-left shadow-sm transition hover:scale-[1.02]"
          >
            {dest.image && (
              <Image
                src={dest.image}
                alt={dest.city}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-nexa-ink/75 via-nexa-ink/20 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <span className="block text-sm font-bold text-white drop-shadow-md">
                {dest.city}
              </span>
              <span className="text-[0.65rem] font-medium text-white/90">
                {tf("explore.collectionStaysCount", { count: dest.listingCount })}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
