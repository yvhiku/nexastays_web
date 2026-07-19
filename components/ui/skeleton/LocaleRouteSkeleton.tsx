import { NavbarSkeleton } from "./NavbarSkeleton";
import { SearchBarSkeleton } from "./SearchBarSkeleton";
import { Skeleton } from "./Skeleton";
import { SkeletonSection } from "./SkeletonSection";

/**
 * Route-level shell only — not a listing grid (sections own those).
 */
export function LocaleRouteSkeleton() {
  return (
    <SkeletonSection
      busy
      className="min-h-screen bg-nexa-bg-1"
      aria-label="Loading page"
    >
      <NavbarSkeleton />
      <main className="pt-[72px]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14 space-y-8">
          <div className="space-y-3 max-w-xl">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <SearchBarSkeleton />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </SkeletonSection>
  );
}
