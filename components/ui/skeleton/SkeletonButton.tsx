import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

export interface SkeletonButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS = {
  sm: "h-9 w-24 rounded-xl",
  md: "h-11 w-28 rounded-[14px]",
  lg: "h-12 w-32 rounded-[18px]",
} as const;

export function SkeletonButton({
  size = "sm",
  className,
  ...props
}: SkeletonButtonProps) {
  return <Skeleton className={cn(SIZE_CLASS[size], className)} {...props} />;
}
