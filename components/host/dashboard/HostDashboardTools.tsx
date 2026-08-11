"use client";

import React from "react";
import { ChevronDown, Wrench } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

/**
 * Collapsed Tools section for calendar sync + availability blocking.
 * Keep both capabilities visible behind a single disclosure; never drop them.
 */
export function HostDashboardTools({
  title,
  description,
  children,
  defaultOpen = false,
}: Props) {
  return (
    <details
      id="host-calendar-sync"
      className="host-portal-card group mb-8 scroll-mt-24 open:shadow-[var(--host-shadow-hover)]"
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--host-primary-soft)] text-[color:var(--host-primary)]">
          <Wrench className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold text-[color:var(--host-text)]">
            {title}
          </span>
          {description ? (
            <span className="mt-0.5 block text-sm text-[color:var(--host-text-secondary)]">
              {description}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-[color:var(--host-muted)] transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-6 border-t border-[color:var(--host-border)] px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
        {children}
      </div>
    </details>
  );
}
