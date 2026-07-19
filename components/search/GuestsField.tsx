"use client";

import React from "react";
import { GuestStepper } from "./GuestStepper";
import type { SearchBarValue } from "./types";
import { cn } from "@/lib/utils";

type TFn = (key: string) => string;

export type GuestsPanelProps = {
  value: Pick<SearchBarValue, "adults" | "children" | "infants" | "pets">;
  onChange: (patch: Partial<SearchBarValue>) => void;
  /** Cap adults+children (booking card). Search leaves undefined. */
  maxOccupancy?: number;
  t: TFn;
  className?: string;
  /** Extra warning / note nodes below steppers */
  footer?: React.ReactNode;
};

export function GuestsPanel({
  value,
  onChange,
  maxOccupancy,
  t,
  className,
  footer,
}: GuestsPanelProps) {
  const occ = value.adults + value.children;

  return (
    <div className={cn("p-4 sm:p-5 w-full min-w-[280px] max-w-sm", className)}>
      <GuestStepper
        label={t("searchBar.adults")}
        subtitle={t("searchBar.adultsSub")}
        value={value.adults}
        min={1}
        max={16}
        onChange={(adults) => onChange({ adults })}
      />
      <GuestStepper
        label={t("searchBar.children")}
        subtitle={t("searchBar.childrenSub")}
        value={value.children}
        min={0}
        max={16}
        onChange={(children) => onChange({ children })}
      />
      <GuestStepper
        label={t("searchBar.infants")}
        subtitle={t("searchBar.infantsSub")}
        value={value.infants}
        min={0}
        max={5}
        onChange={(infants) => onChange({ infants })}
      />
      <GuestStepper
        label={t("searchBar.pets")}
        subtitle={t("searchBar.petsSub")}
        value={value.pets}
        min={0}
        max={5}
        onChange={(pets) => onChange({ pets })}
      />
      {maxOccupancy != null && occ > maxOccupancy && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <p>
            {t("searchBar.maxOccupancy")}:{" "}
            <span className="font-semibold">
              {maxOccupancy} {t("searchBar.guestsWord")}
            </span>
          </p>
          <p>
            {t("searchBar.yourGroup")}:{" "}
            <span className="font-semibold">
              {occ} {t("searchBar.guestsWord")}
            </span>
          </p>
        </div>
      )}
      {footer}
    </div>
  );
}
