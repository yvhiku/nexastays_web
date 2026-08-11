import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
};

export function HostPortalCard({ children, className, interactive }: Props) {
  return (
    <div
      className={cn(
        "host-portal-card",
        interactive && "host-portal-card--interactive",
        className,
      )}
    >
      {children}
    </div>
  );
}
