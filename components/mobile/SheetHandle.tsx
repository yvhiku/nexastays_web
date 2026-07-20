import React from "react";
import { cn } from "@/lib/utils";

export function SheetHandle({ className }: { className?: string }) {
  return (
    <div
      className={cn("mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-nexa-line", className)}
      aria-hidden
    />
  );
}
