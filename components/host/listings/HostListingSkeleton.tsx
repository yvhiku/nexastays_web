"use client";

import React from "react";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";

type Props = {
  count?: number;
};

export function HostListingSkeleton({ count = 6 }: Props) {
  return (
    <ul
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <HostPortalCard className="overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-[color:var(--host-primary-soft)]" />
            <div className="space-y-3 p-4 sm:p-5">
              <div className="h-5 w-3/4 rounded bg-[color:var(--host-primary-soft)]" />
              <div className="h-4 w-1/2 rounded bg-[color:var(--host-primary-soft)]" />
              <div className="flex gap-2 pt-1">
                <div className="h-8 w-20 rounded-lg bg-[color:var(--host-primary-soft)]" />
                <div className="h-8 w-20 rounded-lg bg-[color:var(--host-primary-soft)]" />
              </div>
            </div>
          </HostPortalCard>
        </li>
      ))}
    </ul>
  );
}
