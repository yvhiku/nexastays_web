import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  title: string;
  body: string;
  listingsPath: string;
  ctaLabel: string;
};

export function SeoLandingClosingCta({ title, body, listingsPath, ctaLabel }: Props) {
  return (
    <section className="rounded-[22px] border border-nexa-primary/20 bg-gradient-to-br from-nexa-primary-soft/40 to-nexa-surface p-8 sm:p-10 text-center">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold text-nexa-ink">{title}</h2>
      <p className="text-nexa-muted mt-3 max-w-xl mx-auto text-sm sm:text-base">{body}</p>
      <div className="mt-6">
        <Link href={listingsPath} prefetch={false} className={buttonVariants({ size: "lg" })}>
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
