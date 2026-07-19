import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

export interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export function SkeletonAvatar({
  size = 40,
  className,
  style,
  ...props
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      className={cn("skeleton-circle rounded-full", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    />
  );
}
