"use client";

import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { SkeletonCard } from "@/components/ui/skeleton/SkeletonCard";
import { WIZARD_STICKY_TOP } from "./wizard-chrome";

/** Wizard-shaped loading state (sidebar rows + form cards) instead of a full-screen loader. */
export function WizardSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="grid min-h-screen grid-cols-1 lg:grid-cols-[320px_1fr]"
      style={{ paddingTop: WIZARD_STICKY_TOP }}
    >
      <aside className="hidden bg-gradient-to-br from-nexa-ink to-nexa-ink-2 p-8 lg:block">
        <Skeleton className="mb-8 h-9 w-36 bg-white/10" />
        <Skeleton className="mb-6 h-1 w-full bg-white/10" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="h-7 w-7 rounded-full bg-white/10" />
              <Skeleton className="h-4 flex-1 bg-white/10" />
            </div>
          ))}
        </div>
      </aside>
      <div className="bg-nexa-bg px-4 py-8 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-[720px] space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} className="space-y-4 p-6">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
              <Skeleton className="h-11 w-full" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}
