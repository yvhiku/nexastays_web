"use client";

import React from "react";
import { Star } from "lucide-react";
import type { SignedMedia } from "@/lib/messaging/messages-api";
import { UserAvatar } from "@/components/avatar/UserAvatar";

type Props = {
  label: string;
  name: string;
  avatar?: SignedMedia | null;
  rating?: number | null;
};

export function BookingHostPreview({ label, name, avatar, rating }: Props) {
  return (
    <section className="flex items-center gap-3" aria-label={label}>
      <UserAvatar name={name} media={avatar} size="md" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-nexa-ink-4">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-nexa-ink">{name}</p>
        {typeof rating === "number" ? (
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-nexa-ink-3">
            <Star className="h-3.5 w-3.5 fill-nexa-accent/30 text-nexa-accent" aria-hidden />
            {rating.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </span>
        ) : null}
      </div>
    </section>
  );
}
