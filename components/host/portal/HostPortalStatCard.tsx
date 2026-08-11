import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";

type Props = {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: React.ReactNode;
  supportingText?: string;
  className?: string;
};

/** Presentation-only KPI card — no metric calculation. */
export function HostPortalStatCard({
  label,
  value,
  icon: Icon,
  trend,
  supportingText,
  className,
}: Props) {
  return (
    <HostPortalCard className={cn("p-6", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[color:var(--host-text-secondary)]">
          {label}
        </p>
        {Icon ? (
          <div className="rounded-lg bg-[color:var(--host-primary-soft)] p-2 text-[color:var(--host-primary)]">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        ) : null}
      </div>
      <div className="text-3xl font-semibold tracking-tight text-[color:var(--host-text)] sm:text-4xl">
        {value}
      </div>
      {trend ? <div className="mt-2 text-sm">{trend}</div> : null}
      {supportingText ? (
        <p className="mt-2 text-sm text-[color:var(--host-text-secondary)]">
          {supportingText}
        </p>
      ) : null}
    </HostPortalCard>
  );
}
