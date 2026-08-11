"use client";

import React from "react";
import { HostPortalPageHeader } from "@/components/host/portal/HostPortalPageHeader";

type Props = {
  hostName: string;
  asOf?: string | null;
  timezone?: string | null;
  t: (key: string) => string;
  actions?: React.ReactNode;
};

export function HostDashboardWelcome({
  hostName,
  asOf,
  timezone,
  t,
  actions,
}: Props) {
  const first = hostName.trim().split(/\s+/)[0] || hostName;
  const subtitleParts: string[] = [t("hostPortal.dashboard.welcomeSubtitle")];
  if (timezone) {
    subtitleParts.push(
      t("hostDashboard.timezoneHint").replace("{timezone}", timezone),
    );
  }

  return (
    <HostPortalPageHeader
      title={t("hostPortal.dashboard.welcomeTitle").replace("{name}", first)}
      description={subtitleParts.join(" · ")}
      eyebrow={asOf ? t("hostPortal.dashboard.asOf").replace("{asOf}", asOf) : undefined}
      actions={actions}
    />
  );
}
