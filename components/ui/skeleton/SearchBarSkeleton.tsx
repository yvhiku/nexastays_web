import { Skeleton } from "./Skeleton";
import { SkeletonButton } from "./SkeletonButton";

/** Matches Where | When | Guests | Search chrome. */
export function SearchBarSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-2xl sm:rounded-full shadow-nexa-lg border border-nexa-line p-2 flex flex-col sm:flex-row items-stretch sm:items-center max-w-[920px] mx-auto w-full"
    >
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-nexa-line min-w-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-3.5 px-5 min-h-[64px] flex flex-col justify-center gap-2"
          >
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-4 w-[75%]" />
          </div>
        ))}
      </div>
      <div className="p-2 sm:ps-2 flex items-center">
        <SkeletonButton size="lg" className="w-full sm:w-28 rounded-full" />
      </div>
    </div>
  );
}
