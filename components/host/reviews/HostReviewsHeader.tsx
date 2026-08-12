"use client";

import React from "react";
import { HostPortalPageHeader } from "@/components/host/portal/HostPortalPageHeader";

type TranslateFn = (key: string) => string;

type Props = {
  t: TranslateFn;
};

export function HostReviewsHeader({ t }: Props) {
  return (
    <HostPortalPageHeader
      title={t("hostPortal.reviews.title")}
      description={t("hostPortal.reviews.subtitle")}
    />
  );
}
