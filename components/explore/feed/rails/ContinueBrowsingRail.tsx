"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ContinueBrowsingRailData } from "../types";
import type { RecentlyViewedItem } from "@/lib/recently-viewed";

type Props = {
  data: ContinueBrowsingRailData;
  localePath: (path: string) => string;
  t: (key: string) => string;
  className?: string;
};

function MiniCard({
  item,
  localePath,
}: {
  item: RecentlyViewedItem;
  localePath: (path: string) => string;
}) {
  const placeholder =
    "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80";

  return (
    <Link
      href={localePath(`/listings/${item.id}`)}
      className="group flex w-[148px] shrink-0 flex-col overflow-hidden rounded-xl border border-nexa-line/60 bg-white shadow-sm transition hover:border-nexa-primary/40"
    >
      <div className="relative h-[92px] w-full bg-nexa-bg-2">
        <Image
          src={item.imageUrl || placeholder}
          alt={item.title}
          fill
          sizes="148px"
          className="object-cover transition group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs font-semibold text-nexa-ink leading-snug">
          {item.title}
        </p>
        {item.city && (
          <p className="mt-0.5 text-[0.65rem] text-nexa-ink-4">{item.city}</p>
        )}
      </div>
    </Link>
  );
}

export function ContinueBrowsingRail({
  data,
  localePath,
  t,
  className,
}: Props) {
  if (data.items.length === 0) return null;

  return (
    <section className={cn("mb-5 min-w-0", className)}>
      <h2 className="mb-2.5 font-display text-base font-semibold text-nexa-ink">
        {t("explore.continueBrowsing")}
      </h2>
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none">
        {data.items.map((item) => (
          <MiniCard key={item.id} item={item} localePath={localePath} />
        ))}
      </div>
    </section>
  );
}
