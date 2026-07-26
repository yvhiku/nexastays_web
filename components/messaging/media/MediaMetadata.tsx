"use client";

import React from "react";
import { formatFileSize, type MediaItem } from "./types";

type Props = {
  item: MediaItem;
  sentByLabel: string;
  locale?: string;
  className?: string;
};

export function MediaMetadata({
  item,
  sentByLabel,
  locale,
  className,
}: Props) {
  const date = new Date(item.createdAt);
  const validDate = !Number.isNaN(date.getTime());
  const size = formatFileSize(item.attachment?.sizeBytes);

  return (
    <div className={className}>
      <p className="truncate text-sm font-bold text-current">{item.label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-current/65">
        {item.senderLabel ? (
          <span>{sentByLabel.replace("{name}", item.senderLabel)}</span>
        ) : null}
        {validDate ? (
          <time dateTime={item.createdAt}>
            {new Intl.DateTimeFormat(locale, {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }).format(date)}
          </time>
        ) : null}
        {size ? <span>{size}</span> : null}
      </div>
    </div>
  );
}
