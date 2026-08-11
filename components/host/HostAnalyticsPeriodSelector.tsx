"use client";

import React from "react";
import { NexaSelect } from "@/components/ui/NexaSelect";
import type { HostAnalyticsPeriodId } from "@/lib/stays-types";
import { HOST_ANALYTICS_PERIODS } from "@/lib/stays-types";

type TranslateFn = (key: string) => string;

interface HostAnalyticsPeriodSelectorProps {
  value: HostAnalyticsPeriodId;
  onChange: (period: HostAnalyticsPeriodId) => void;
  disabled?: boolean;
  t: TranslateFn;
}

const PERIOD_LABEL_KEY: Record<HostAnalyticsPeriodId, string> = {
  this_month: "hostAnalytics.periodThisMonth",
  previous_month: "hostAnalytics.periodPreviousMonth",
  all_time: "hostAnalytics.periodAllTime",
  next_30d: "hostAnalytics.periodNext30d",
};

export function HostAnalyticsPeriodSelector({
  value,
  onChange,
  disabled,
  t,
}: HostAnalyticsPeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label
        htmlFor="host-analytics-period"
        className="text-sm font-medium text-nexa-ink"
      >
        {t("hostAnalytics.periodLabel")}
      </label>
      <div className="min-w-[12rem]">
        <NexaSelect
          id="host-analytics-period"
          variant="field"
          value={value}
          disabled={disabled}
          aria-label={t("hostAnalytics.periodLabel")}
          onChange={(v) => {
            if ((HOST_ANALYTICS_PERIODS as readonly string[]).includes(v)) {
              onChange(v as HostAnalyticsPeriodId);
            }
          }}
          options={HOST_ANALYTICS_PERIODS.map((id) => ({
            value: id,
            label: t(PERIOD_LABEL_KEY[id]),
          }))}
        />
      </div>
    </div>
  );
}
