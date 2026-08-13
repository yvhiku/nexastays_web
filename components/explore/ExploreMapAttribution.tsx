"use client";

import React from "react";
import { cn } from "@/lib/utils";

const OSM_HREF = "https://www.openstreetmap.org/copyright";
const CARTO_HREF = "https://carto.com/attributions";

type ExploreMapAttributionProps = {
  className?: string;
};

/** Compact linked OSM · CARTO credit — replaces Leaflet default attribution chrome. */
export function ExploreMapAttribution({ className }: ExploreMapAttributionProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-3 left-3 z-layer-content max-w-[min(100%-5rem,16rem)] rounded-lg border border-nexa-line/70 bg-white/90 px-2 py-1 text-[0.65rem] leading-snug text-nexa-ink-4 shadow-sm",
        className,
      )}
    >
      <span className="text-nexa-ink-4">© </span>
      <a
        href={OSM_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-nexa-ink-3 underline-offset-2 hover:text-nexa-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 focus-visible:ring-offset-1 rounded-sm"
      >
        OpenStreetMap
      </a>
      <span className="text-nexa-ink-4"> · </span>
      <a
        href={CARTO_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-nexa-ink-3 underline-offset-2 hover:text-nexa-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 focus-visible:ring-offset-1 rounded-sm"
      >
        CARTO
      </a>
    </div>
  );
}
