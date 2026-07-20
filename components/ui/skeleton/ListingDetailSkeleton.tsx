import React from "react";
import { Skeleton } from "./Skeleton";
import { SkeletonImage } from "./SkeletonImage";
import { SkeletonText } from "./SkeletonText";
import { SkeletonButton } from "./SkeletonButton";

/** Full listing detail page placeholder — gallery, header, amenities, CTA. */
export function ListingDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6" aria-busy="true" aria-label="Loading listing">
      <SkeletonImage ratio="16/10" className="mb-6 w-full rounded-2xl" />
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="space-y-3">
            <SkeletonText className="h-8 w-3/4 max-w-md" />
            <SkeletonText className="h-4 w-1/2 max-w-xs" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <div className="space-y-2">
            <SkeletonText className="h-5 w-40" />
            <SkeletonText className="h-4 w-full" />
            <SkeletonText className="h-4 w-5/6" />
            <SkeletonText className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <SkeletonButton size="lg" className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
