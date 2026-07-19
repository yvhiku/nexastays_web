"use client";

import { cn } from "@/lib/utils";
import { ListingCardSkeleton } from "./ListingCardSkeleton";
import { SkeletonSection } from "./SkeletonSection";
import { useDelayedLoading } from "./useDelayedLoading";
import { useSkeletonCount } from "./useSkeletonCount";

export interface ListingGridSkeletonProps {
  className?: string;
  /** Override viewport-derived count */
  count?: number;
  /** Delay ~180ms before paint (default true) */
  delay?: boolean;
  /** Explore: 1/2/3 cols; saved: 1/md:3 */
  variant?: "explore" | "saved";
}

const GRID = {
  explore: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
  saved: "grid grid-cols-1 md:grid-cols-3 gap-4",
} as const;

export function ListingGridSkeleton({
  className,
  count,
  delay = true,
  variant = "explore",
}: ListingGridSkeletonProps) {
  const viewportCount = useSkeletonCount(
    variant === "saved"
      ? { mobile: 3, tablet: 6, desktop: 6 }
      : { mobile: 6, tablet: 9, desktop: 15 },
  );
  const n = count ?? viewportCount;
  const show = useDelayedLoading(true, delay ? 180 : 0);

  if (!show) return null;

  return (
    <SkeletonSection
      busy
      className={cn(GRID[variant], className)}
      aria-label="Loading listings"
    >
      {Array.from({ length: n }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </SkeletonSection>
  );
}
