import * as React from "react";
import { cn } from "@/lib/utils";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/** Dumb shimmer block. Domain layouts compose higher up. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton skeleton-shimmer skeleton-rounded", className)}
      {...props}
    />
  );
}
