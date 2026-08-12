"use client";

import React from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { Button } from "@/components/ui/button";

type TranslateFn = (key: string) => string;

type Props = {
  t: TranslateFn;
  localePath: (path: string) => string;
};

export function HostInsightsEmptyState({ t, localePath }: Props) {
  return (
    <HostPortalCard className="p-8 text-center sm:p-10">
      <BarChart3
        className="mx-auto mb-3 h-10 w-10 text-[color:var(--host-primary)]"
        aria-hidden
      />
      <h2 className="text-lg font-semibold text-[color:var(--host-text)]">
        {t("hostAnalytics.emptyTitle")}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--host-text-secondary)]">
        {t("hostAnalytics.emptyDesc")}
      </p>
      <Button asChild className="mt-5">
        <Link href={localePath("/host/listings/new")}>
          {t("hostAnalytics.addListing")}
        </Link>
      </Button>
    </HostPortalCard>
  );
}
