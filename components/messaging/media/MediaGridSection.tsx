"use client";

import React from "react";
import type { MediaItem } from "./types";

type Props = {
  title: string;
  items: MediaItem[];
  renderItem: (item: MediaItem, index: number) => React.ReactNode;
};

export function MediaGridSection({ title, items, renderItem }: Props) {
  return (
    <section aria-labelledby={`media-section-${title.replace(/\W+/g, "-")}`}>
      <div className="sticky top-0 z-layer-sticky -mx-1 mb-3 bg-white/90 px-1 py-2 backdrop-blur-xl">
        <h3
          id={`media-section-${title.replace(/\W+/g, "-")}`}
          className="font-display text-base font-semibold text-nexa-ink"
        >
          {title}
        </h3>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {items.map(renderItem)}
      </div>
    </section>
  );
}
