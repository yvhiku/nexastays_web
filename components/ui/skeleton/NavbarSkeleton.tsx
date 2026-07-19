import { Skeleton } from "./Skeleton";
import { SkeletonAvatar } from "./SkeletonAvatar";

/** Fixed 72px nav chrome for route loading.tsx shell. */
export function NavbarSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 inset-x-0 z-50 h-[72px] border-b border-nexa-line/60 bg-[rgba(253,251,252,0.92)] backdrop-blur-md"
    >
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-28 hidden sm:block" />
        </div>
        <div className="hidden xl:flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-10 rounded-full" />
          <SkeletonAvatar size={36} />
        </div>
      </div>
    </div>
  );
}
