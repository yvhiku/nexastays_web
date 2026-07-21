import React from "react";
import Link from "next/link";
import type { SeoLandingPoi } from "@/lib/seo/types";

type Props = {
  title: string;
  items: SeoLandingPoi[];
  localePath: (path: string) => string;
  defaultCta: string;
};

export function SeoLandingPoiCards({ title, items, localePath, defaultCta }: Props) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-nexa-ink mb-5">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((poi) => {
          const href = localePath(poi.href.replace(/^\/(en|fr|ar)/, ""));
          const ctaHref = poi.cta_href
            ? localePath(poi.cta_href.replace(/^\/(en|fr|ar)/, ""))
            : href;
          return (
            <article
              key={poi.name}
              className="rounded-[18px] border border-nexa-border/80 bg-nexa-surface/40 p-5 flex flex-col"
            >
              <h3 className="font-semibold text-nexa-ink">{poi.name}</h3>
              {(poi.distance_km != null || poi.travel_time) && (
                <p className="text-xs text-nexa-muted mt-1">
                  {[poi.distance_km != null ? `${poi.distance_km} km` : null, poi.travel_time]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {poi.description && (
                <p className="text-sm text-nexa-muted mt-2 flex-1">{poi.description}</p>
              )}
              <Link
                href={ctaHref}
                className="text-sm font-medium text-nexa-primary hover:underline mt-4 inline-block"
              >
                {poi.cta_label ?? defaultCta} →
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
