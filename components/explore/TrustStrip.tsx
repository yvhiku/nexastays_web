"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  EXPLORE_TRUST_ITEMS,
  EXPLORE_TRUST_LEARN_MORE_PATH,
} from "@/lib/explore-trust";

export type TrustStripProps = {
  localePath: (path: string) => string;
  t: (key: string) => string;
  className?: string;
};

export function TrustStrip({ localePath, t, className }: TrustStripProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-nexa-primary/15 bg-nexa-primary-soft/60 px-5 py-5 sm:px-6 sm:py-6 min-w-0",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-nexa-ink mb-3">
            {t("explore.trustTitle")}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {EXPLORE_TRUST_ITEMS.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2 text-sm text-nexa-ink-2"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-nexa-primary"
                  aria-hidden
                />
                <span>{t(item.labelKey)}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          href={localePath(EXPLORE_TRUST_LEARN_MORE_PATH)}
          className="shrink-0 text-sm font-semibold text-nexa-primary hover:text-nexa-primary-dark"
        >
          {t("explore.trustLearnMore")} →
        </Link>
      </div>
    </section>
  );
}
