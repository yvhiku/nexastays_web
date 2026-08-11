"use client";

import React from "react";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";

type Props = {
  count?: number;
};

export function HostBookingSkeleton({ count = 3 }: Props) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <HostPortalCard key={i} className="animate-pulse p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full bg-[color:var(--host-primary-soft)]" />
                <div className="h-5 w-24 rounded-md bg-[color:var(--host-primary-soft)]" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="h-3 w-12 rounded bg-[color:var(--host-primary-soft)]" />
                  <div className="h-5 w-36 rounded bg-[color:var(--host-primary-soft)]" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-[color:var(--host-primary-soft)]" />
                  <div className="h-5 w-40 rounded bg-[color:var(--host-primary-soft)]" />
                </div>
              </div>
              <div className="h-4 w-56 rounded bg-[color:var(--host-primary-soft)]" />
            </div>
            <div className="flex gap-2 lg:flex-col">
              <div className="h-10 w-28 rounded-xl bg-[color:var(--host-primary-soft)]" />
              <div className="h-10 w-28 rounded-xl bg-[color:var(--host-primary-soft)]" />
            </div>
          </div>
        </HostPortalCard>
      ))}
    </div>
  );
}
