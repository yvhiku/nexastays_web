"use client";

import React from "react";
import type { SignedMedia } from "@/lib/messaging/messages-api";
import { ProgressiveImage } from "../ProgressiveImage";

type Props = {
  cover?: SignedMedia | null;
  propertyName: string;
  fallbackLabel: string;
  retryLabel: string;
  compact?: boolean;
};

export function BookingHero({
  cover,
  propertyName,
  fallbackLabel,
  retryLabel,
  compact = false,
}: Props) {
  return (
    <ProgressiveImage
      src={cover?.url ?? null}
      alt={propertyName}
      errorLabel={fallbackLabel}
      retryLabel={retryLabel}
      className={
        compact
          ? "h-[140px] w-full rounded-t-[20px]"
          : "h-[140px] w-full rounded-t-[20px] sm:h-[160px] lg:h-[180px]"
      }
    />
  );
}
