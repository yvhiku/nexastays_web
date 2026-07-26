"use client";

import React, { useMemo } from "react";
import { MediaFileCard } from "./MediaFileCard";
import { MediaGridSection } from "./MediaGridSection";
import { MediaImageCard } from "./MediaImageCard";
import type { MediaItem } from "./types";

type Labels = {
  today: string;
  yesterday: string;
  open: string;
  download: string;
  downloading: string;
  downloaded: string;
  failed: string;
};

type Props = {
  items: MediaItem[];
  selectedIds: Set<string>;
  selectionMode: boolean;
  labels: Labels;
  locale?: string;
  onOpenImage: (item: MediaItem) => void;
  onToggleSelection: (id: string) => void;
};

function groupLabel(
  value: string,
  labels: Pick<Labels, "today" | "yesterday">,
  locale?: string,
) {
  const date = new Date(value);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round(
    (startToday.getTime() - startDate.getTime()) / 86_400_000,
  );
  if (days === 0) return labels.today;
  if (days === 1) return labels.yesterday;
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date);
}

export function MediaGrid({
  items,
  selectedIds,
  selectionMode,
  labels,
  locale,
  onOpenImage,
  onToggleSelection,
}: Props) {
  const groups = useMemo(() => {
    const next = new Map<string, MediaItem[]>();
    for (const item of items) {
      const label = groupLabel(item.createdAt, labels, locale);
      next.set(label, [...(next.get(label) ?? []), item]);
    }
    return [...next.entries()];
  }, [items, labels, locale]);

  return (
    <div className="space-y-7">
      {groups.map(([title, groupItems]) => (
        <MediaGridSection
          key={title}
          title={title}
          items={groupItems}
          renderItem={(item) =>
            item.category === "photo" ? (
              <MediaImageCard
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                selectionMode={selectionMode}
                openLabel={labels.open}
                onOpen={() => onOpenImage(item)}
                onSelect={() => onToggleSelection(item.id)}
              />
            ) : (
              <MediaFileCard
                key={item.id}
                item={item}
                downloadLabel={labels.download}
                downloadingLabel={labels.downloading}
                downloadedLabel={labels.downloaded}
                failedLabel={labels.failed}
                openLabel={labels.open}
              />
            )
          }
        />
      ))}
    </div>
  );
}
