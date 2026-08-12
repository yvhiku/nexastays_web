"use client";

import React from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { Button } from "@/components/ui/button";

type TranslateFn = (key: string) => string;

type Props = {
  kind: "none" | "filter";
  onClearFilter?: () => void;
  t: TranslateFn;
  localePath: (path: string) => string;
};

export function HostListingsEmptyState({
  kind,
  onClearFilter,
  t,
  localePath,
}: Props) {
  if (kind === "none") {
    return (
      <HostPortalCard className="p-8 text-center sm:p-10">
        <Building2
          className="mx-auto mb-3 h-10 w-10 text-[color:var(--host-primary)]"
          aria-hidden
        />
        <p className="text-base font-medium text-[color:var(--host-text)]">
          {t("hostPortal.listings.emptyNoneTitle")}
        </p>
        <p className="mt-1 text-sm text-[color:var(--host-text-secondary)]">
          {t("hostPortal.listings.emptyNoneDesc")}
        </p>
        <Button asChild className="mt-5">
          <Link href={localePath("/host/listings/new")}>
            {t("hostPortal.nav.listNewProperty")}
          </Link>
        </Button>
      </HostPortalCard>
    );
  }

  return (
    <HostPortalCard className="border-dashed p-8 text-center sm:p-10">
      <Building2
        className="mx-auto mb-3 h-10 w-10 text-[color:var(--host-muted)]"
        aria-hidden
      />
      <p className="text-base font-medium text-[color:var(--host-text)]">
        {t("hostPortal.listings.emptyFilterTitle")}
      </p>
      <p className="mt-1 text-sm text-[color:var(--host-text-secondary)]">
        {t("hostPortal.listings.emptyFilterDesc")}
      </p>
      {onClearFilter ? (
        <button
          type="button"
          className="mt-4 text-sm font-medium text-[color:var(--host-primary)] underline"
          onClick={onClearFilter}
        >
          {t("hostPortal.listings.clearFilter")}
        </button>
      ) : null}
    </HostPortalCard>
  );
}
