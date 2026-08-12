"use client";

import React from "react";
import type { HostListingSummary } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import { HostListingCard } from "@/components/host/listings/HostListingCard";

type TranslateFn = (key: string) => string;

type Props = {
  listings: HostListingSummary[];
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
  listingActionId: string | null;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
};

export function HostListingsGrid({
  listings,
  t,
  locale,
  localePath,
  listingActionId,
  onPause,
  onResume,
}: Props) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => (
        <li key={listing.id}>
          <HostListingCard
            listing={listing}
            t={t}
            locale={locale}
            localePath={localePath}
            actionBusy={listingActionId === listing.id}
            onPause={onPause}
            onResume={onResume}
          />
        </li>
      ))}
    </ul>
  );
}
