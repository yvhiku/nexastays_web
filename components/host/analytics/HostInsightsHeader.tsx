"use client";

import React from "react";
import { HostPortalPageHeader } from "@/components/host/portal/HostPortalPageHeader";
import { HostAnalyticsPeriodSelector } from "@/components/host/HostAnalyticsPeriodSelector";
import type { HostAnalyticsPeriodId } from "@/lib/stays-types";

type TranslateFn = (key: string) => string;

type Props = {
  t: TranslateFn;
  period: HostAnalyticsPeriodId;
  onPeriodChange: (period: HostAnalyticsPeriodId) => void;
  periodDisabled?: boolean;
  asOf?: string | null;
  timezone?: string | null;
};

export function HostInsightsHeader({
  t,
  period,
  onPeriodChange,
  periodDisabled,
  asOf,
  timezone,
}: Props) {
  const eyebrowParts: string[] = [];
  if (asOf) {
    eyebrowParts.push(
      t("hostPortal.analytics.asOf").replace("{asOf}", asOf),
    );
  }
  if (timezone) {
    eyebrowParts.push(
      t("hostPortal.analytics.timezone").replace("{timezone}", timezone),
    );
  }

  return (
    <HostPortalPageHeader
      title={t("hostPortal.analytics.title")}
      description={t("hostPortal.analytics.subtitle")}
      eyebrow={eyebrowParts.length ? eyebrowParts.join(" · ") : undefined}
      actions={
        <HostAnalyticsPeriodSelector
          value={period}
          onChange={onPeriodChange}
          disabled={periodDisabled}
          t={t}
        />
      }
    />
  );
}
