import React from "react";
import { GeoBlock } from "@/components/seo/GeoBlock";
import type { GeoBlockDto } from "@/lib/seo/types";

type Props = { title: string; items: GeoBlockDto[] };

export function SeoLandingFaq({ title, items }: Props) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-[22px] bg-nexa-bg/60 p-6 sm:p-8">
      <h2 className="font-display text-xl font-semibold text-nexa-ink mb-5">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((block) => (
          <GeoBlock key={block.question} question={block.question} answer={block.answer} />
        ))}
      </div>
    </section>
  );
}
