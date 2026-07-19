import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

const DEFAULT_WIDTHS = ["100%", "85%", "70%"] as const;

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  /** Per-line widths; cycles DEFAULT_WIDTHS when omitted */
  widths?: string[];
  lineClassName?: string;
}

export function SkeletonText({
  lines = 3,
  widths,
  className,
  lineClassName,
  ...props
}: SkeletonTextProps) {
  const resolved = widths ?? DEFAULT_WIDTHS;
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden="true" {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3 w-full", lineClassName)}
          style={{ width: resolved[i % resolved.length] }}
        />
      ))}
    </div>
  );
}
