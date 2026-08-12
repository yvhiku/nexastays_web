"use client";

import React from "react";
import { MessageSquareQuote } from "lucide-react";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";

type TranslateFn = (key: string) => string;

type Props = {
  t: TranslateFn;
};

export function HostReviewsEmptyState({ t }: Props) {
  return (
    <HostPortalCard className="p-8 text-center sm:p-10">
      <MessageSquareQuote
        className="mx-auto mb-3 h-10 w-10 text-[color:var(--host-primary)]"
        aria-hidden
      />
      <h2 className="text-lg font-semibold text-[color:var(--host-text)]">
        {t("hostReviews.emptyTitle")}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--host-text-secondary)]">
        {t("hostReviews.emptyDesc")}
      </p>
    </HostPortalCard>
  );
}
