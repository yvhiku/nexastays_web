import { Suspense } from "react";
import type { Locale } from "@/lib/i18n";
import { WhyNexaSection } from "./sections/why/WhyNexa.server";
import { StatsSection } from "./sections/stats/Stats.server";
import { DestinationsSection } from "./sections/destinations/Destinations.server";
import { HowItWorksSection } from "./sections/how-it-works/HowItWorks.server";
import { HostCtaSection } from "./sections/host-cta/HostCta.server";

type Props = {
  locale: Locale;
};

export function MarketingSections({ locale }: Props) {
  return (
    <>
      <WhyNexaSection locale={locale} />
      <Suspense fallback={null}>
        <StatsSection locale={locale} />
      </Suspense>
      <DestinationsSection locale={locale} />
      <HowItWorksSection locale={locale} />
      <HostCtaSection locale={locale} />
    </>
  );
}
