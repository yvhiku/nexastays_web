"use client";

import React from "react";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";

type Props = {
  count?: number;
};

export function HostInsightsSkeleton({ count = 2 }: Props) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <HostPortalCard
            key={i}
            className="h-36 animate-pulse bg-[color:var(--host-surface)]"
          >
            <span className="sr-only">Loading</span>
          </HostPortalCard>
        ))}
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <HostPortalCard
          key={`row-${i}`}
          className="h-48 animate-pulse bg-[color:var(--host-surface)]"
        >
          <span className="sr-only">Loading</span>
        </HostPortalCard>
      ))}
    </div>
  );
}
