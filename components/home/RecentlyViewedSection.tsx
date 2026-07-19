"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getRecentlyViewed,
  type RecentlyViewedItem,
} from "@/lib/recently-viewed";

export function RecentlyViewedSection() {
  const { t, localePath } = useLanguage();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    const refresh = () => setItems(getRecentlyViewed());
    refresh();
    window.addEventListener("nexa-recently-viewed-changed", refresh);
    return () => window.removeEventListener("nexa-recently-viewed-changed", refresh);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-nexa-bg-2/60">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-nexa-ink mb-5">
          {t("pwa.recentlyViewed")}
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {items.map((item) => (
            <Link
              key={item.id}
              href={localePath(`/listings/${item.id}`)}
              className="snap-start shrink-0 w-44 sm:w-52 rounded-2xl border border-nexa-line bg-white overflow-hidden hover:border-nexa-primary/40 transition-colors"
            >
              <div className="relative h-28 bg-nexa-bg-2">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="208px"
                    unoptimized={item.imageUrl.startsWith("http://")}
                  />
                ) : null}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-nexa-ink line-clamp-2">
                  {item.title}
                </p>
                {item.city ? (
                  <p className="text-xs text-nexa-ink-4 mt-1">{item.city}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
