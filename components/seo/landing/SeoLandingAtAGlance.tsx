import React from "react";
import type { SeoLandingAtAGlance } from "@/lib/seo/types";

type Props = { title: string; items: SeoLandingAtAGlance[] };

export function SeoLandingAtAGlance({ title, items }: Props) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-nexa-ink mb-4">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={`${item.label}-${item.value}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-nexa-border bg-nexa-surface/60 px-3 py-1.5 text-sm text-nexa-ink"
          >
            {item.icon && <span aria-hidden>{item.icon}</span>}
            <span className="text-nexa-muted">{item.label}:</span>
            <span className="font-medium">{item.value}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
