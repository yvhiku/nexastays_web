"use client";

import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HostPortalPageHeader } from "@/components/host/portal/HostPortalPageHeader";

type TranslateFn = (key: string) => string;

type Props = {
  t: TranslateFn;
  exportOpen: boolean;
  onToggleExport: () => void;
  countLabel?: string | null;
};

export function HostBookingsHeader({
  t,
  exportOpen,
  onToggleExport,
  countLabel,
}: Props) {
  return (
    <HostPortalPageHeader
      title={t("hostPortal.bookingsTitle")}
      description={
        countLabel
          ? `${t("hostPortal.bookingsSubtitle")} · ${countLabel}`
          : t("hostPortal.bookingsSubtitle")
      }
      actions={
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={onToggleExport}
          aria-expanded={exportOpen}
        >
          <Download className="h-4 w-4" aria-hidden />
          {t("hostDashboard.exportCsv")}
        </Button>
      }
    />
  );
}
