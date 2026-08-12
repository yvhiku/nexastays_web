"use client";

import React from "react";
import type { ReviewSort } from "@/lib/stays-types";
import {
  HOST_REVIEW_SORT_ORDER,
} from "@/lib/host-reviews";
import { HostPortalPageHeader } from "@/components/host/portal/HostPortalPageHeader";
import { HostPortalSortSelect } from "@/components/host/portal/HostPortalSortSelect";

type TranslateFn = (key: string) => string;

const SORT_LABEL_KEYS: Record<ReviewSort, string> = {
  newest: "hostPortal.reviews.sortNewest",
  highest: "hostPortal.reviews.sortHighest",
  lowest: "hostPortal.reviews.sortLowest",
};

type Props = {
  t: TranslateFn;
  sort?: ReviewSort;
  onSortChange?: (sort: ReviewSort) => void;
  sortDisabled?: boolean;
};

export function HostReviewsHeader({
  t,
  sort,
  onSortChange,
  sortDisabled,
}: Props) {
  return (
    <HostPortalPageHeader
      title={t("hostPortal.reviews.title")}
      description={t("hostPortal.reviews.subtitle")}
      actions={
        sort != null && onSortChange ? (
          <HostPortalSortSelect
            className="w-full min-w-[11rem] sm:w-52"
            label={t("hostPortal.sortBy")}
            value={sort}
            onChange={(v) => onSortChange(v as ReviewSort)}
            options={HOST_REVIEW_SORT_ORDER.map((id) => ({
              value: id,
              label: t(SORT_LABEL_KEYS[id]),
            }))}
            disabled={sortDisabled}
          />
        ) : undefined
      }
    />
  );
}
