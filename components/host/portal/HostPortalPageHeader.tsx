import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
  className?: string;
};

export function HostPortalPageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[color:var(--host-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[color:var(--host-text)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-base text-[color:var(--host-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
