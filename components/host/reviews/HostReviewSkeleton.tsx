"use client";

import React from "react";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";

type Props = {
  count?: number;
};

export function HostReviewSkeleton({ count = 3 }: Props) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <HostPortalCard
          key={i}
          className="h-32 animate-pulse bg-[color:var(--host-surface)]"
        >
          <span className="sr-only">Loading</span>
        </HostPortalCard>
      ))}
    </div>
  );
}
