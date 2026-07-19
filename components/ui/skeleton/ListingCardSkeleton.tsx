import {
  LISTING_CARD_IMAGE_RATIO,
  LISTING_CARD_RADIUS,
} from "@/components/listing/listing-card-dims";
import { Skeleton } from "./Skeleton";
import { SkeletonButton } from "./SkeletonButton";
import { SkeletonCard } from "./SkeletonCard";
import { SkeletonImage } from "./SkeletonImage";

/** Layout-matched placeholder for ListingCard. */
export function ListingCardSkeleton() {
  return (
    <SkeletonCard className={LISTING_CARD_RADIUS}>
      <SkeletonImage
        ratio={LISTING_CARD_IMAGE_RATIO}
        className="rounded-none rounded-t-2xl"
      />
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-5 w-[85%]" />
        <div className="space-y-2 min-h-[2.5rem]">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-[70%]" />
        </div>
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-nexa-line/60">
          <Skeleton className="h-6 w-28" />
          <SkeletonButton size="sm" />
        </div>
        <Skeleton className="h-3 w-[90%] mt-1" />
      </div>
    </SkeletonCard>
  );
}
