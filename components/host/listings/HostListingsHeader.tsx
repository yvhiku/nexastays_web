"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HostPortalPageHeader } from "@/components/host/portal/HostPortalPageHeader";

type TranslateFn = (key: string) => string;

type Props = {
  t: TranslateFn;
  localePath: (path: string) => string;
  countLabel?: string | null;
};

export function HostListingsHeader({ t, localePath, countLabel }: Props) {
  return (
    <HostPortalPageHeader
      title={t("hostPortal.listingsTitle")}
      description={
        countLabel
          ? `${t("hostPortal.listingsSubtitle")} · ${countLabel}`
          : t("hostPortal.listingsSubtitle")
      }
      actions={
        <Button size="sm" asChild>
          <Link
            href={localePath("/host/listings/new")}
            className="inline-flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            {t("hostPortal.nav.listNewProperty")}
          </Link>
        </Button>
      }
    />
  );
}
