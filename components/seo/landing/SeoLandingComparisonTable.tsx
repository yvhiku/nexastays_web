import React from "react";
import type { SeoLandingComparison } from "@/lib/seo/types";
import Link from "next/link";
import { formatStarRating } from "@/components/seo/landing/utils";

type Props = {
  comparison: SeoLandingComparison;
  leftLabel: string;
  title: string;
  localePath: (path: string) => string;
};

function cellValue(text: string, rating?: number): string {
  if (rating != null && rating > 0) return formatStarRating(rating);
  return text;
}

export function SeoLandingComparisonTable({ comparison, leftLabel, title, localePath }: Props) {
  if (!comparison.rows?.length) return null;
  const vsHref = comparison.vs_href
    ? localePath(comparison.vs_href.replace(/^\/(en|fr|ar)/, ""))
    : null;

  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-nexa-ink mb-2">{title}</h2>
      {comparison.summary && <p className="text-sm text-nexa-muted mb-4 max-w-2xl">{comparison.summary}</p>}
      <div className="overflow-x-auto rounded-[16px] border border-nexa-border">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="bg-nexa-surface/60">
              <th className="text-left p-3 font-medium text-nexa-muted" scope="col" />
              <th className="text-left p-3 font-semibold text-nexa-ink" scope="col">
                {leftLabel}
              </th>
              <th className="text-left p-3 font-semibold text-nexa-ink" scope="col">
                {vsHref ? (
                  <Link href={vsHref} className="hover:text-nexa-primary underline-offset-2 hover:underline">
                    {comparison.vs}
                  </Link>
                ) : (
                  comparison.vs
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row) => (
              <tr key={row.label} className="border-t border-nexa-border/60">
                <th className="p-3 text-left font-medium text-nexa-muted" scope="row">
                  {row.label}
                </th>
                <td className="p-3 text-nexa-ink">{cellValue(row.left, row.left_rating)}</td>
                <td className="p-3 text-nexa-ink">{cellValue(row.right, row.right_rating)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
