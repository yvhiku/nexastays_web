import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonSectionProps extends React.HTMLAttributes<HTMLElement> {
  busy?: boolean;
}

/** Section wrapper that toggles aria-busy for loading regions. */
export function SkeletonSection({
  busy = true,
  className,
  children,
  ...props
}: SkeletonSectionProps) {
  return (
    <section
      aria-busy={busy}
      className={cn(className)}
      {...props}
    >
      {children}
    </section>
  );
}
