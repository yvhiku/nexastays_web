"use client";

import React from "react";
import {
  Building2,
  FilePen,
  CirclePause,
  Clock,
  AlertCircle,
} from "lucide-react";
import { HostPortalStatCard } from "@/components/host/portal/HostPortalStatCard";
import type { HostListingFilterId } from "@/lib/host-listings-center";
import { cn } from "@/lib/utils";

type TranslateFn = (key: string) => string;

const ITEMS: {
  id: HostListingFilterId;
  labelKey: string;
  icon: typeof Building2;
  always: boolean;
}[] = [
  {
    id: "all",
    labelKey: "hostPortal.listings.filterAll",
    icon: Building2,
    always: true,
  },
  {
    id: "active",
    labelKey: "hostPortal.listings.filterActive",
    icon: Building2,
    always: true,
  },
  {
    id: "pending",
    labelKey: "hostPortal.listings.filterPending",
    icon: Clock,
    always: true,
  },
  {
    id: "paused",
    labelKey: "hostPortal.listings.filterPaused",
    icon: CirclePause,
    always: true,
  },
  {
    id: "draft",
    labelKey: "hostPortal.listings.filterDraft",
    icon: FilePen,
    always: true,
  },
  {
    id: "needs_changes",
    labelKey: "hostPortal.listings.filterNeedsChanges",
    icon: AlertCircle,
    always: false,
  },
];

type Props = {
  counts: Record<HostListingFilterId, number>;
  activeFilter: HostListingFilterId;
  onSelect: (filter: HostListingFilterId) => void;
  t: TranslateFn;
};

export function HostListingsSummary({
  counts,
  activeFilter,
  onSelect,
  t,
}: Props) {
  const visible = ITEMS.filter(
    (item) => item.always || (counts[item.id] ?? 0) > 0,
  );

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {visible.map((item) => {
        const value = counts[item.id] ?? 0;
        const active = activeFilter === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "rounded-[var(--host-radius)] text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--host-primary)]",
              active && "ring-2 ring-[color:var(--host-primary)]",
            )}
            aria-pressed={active}
          >
            <HostPortalStatCard
              label={t(item.labelKey)}
              value={String(value)}
              icon={item.icon}
              className="h-full p-4 transition-shadow hover:shadow-[var(--host-shadow-hover)] sm:p-5"
            />
          </button>
        );
      })}
    </div>
  );
}
