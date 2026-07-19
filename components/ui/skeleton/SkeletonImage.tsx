import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

export interface SkeletonImageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** CSS aspect-ratio value, e.g. "4/3" */
  ratio?: string;
}

export function SkeletonImage({
  ratio = "4/3",
  className,
  style,
  ...props
}: SkeletonImageProps) {
  return (
    <Skeleton
      className={cn("w-full", className)}
      style={{ aspectRatio: ratio, ...style }}
      {...props}
    />
  );
}
