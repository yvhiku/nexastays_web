import * as React from "react";
import { cn } from "@/lib/utils";

/** Layout shell for card-shaped skeletons — no shimmer of its own. */
export function SkeletonCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-white rounded-2xl overflow-hidden shadow-nexa-card border border-nexa-line/50 min-w-0 w-full",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
