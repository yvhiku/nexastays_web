import React from "react";
import { Skeleton } from "./Skeleton";
import { SkeletonAvatar } from "./SkeletonAvatar";
import { SkeletonText } from "./SkeletonText";

/** Profile header + settings menu placeholders. */
export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-8" aria-busy="true" aria-label="Loading profile">
      <div className="flex flex-col items-center gap-4">
        <SkeletonAvatar size={96} />
        <SkeletonText className="h-6 w-40" />
        <SkeletonText className="h-4 w-56" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
