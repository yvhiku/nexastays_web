import type { Locale } from "@/lib/i18n";
import { getServerTranslations } from "@/lib/i18n/server";
import { HeroContent, HeroTrust } from "./HeroContent.server";
import { HeroActions } from "./HeroActions.client";
import { HeroVisual } from "./HeroVisualLazy.client";

type Props = {
  locale: Locale;
};

export function HeroSection({ locale }: Props) {
  const copy = getServerTranslations(locale);

  return (
    <section className="min-h-0 md:min-h-screen pt-[72px] grid grid-cols-1 md:grid-cols-2 items-center overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_50%,rgba(232,80,122,0.06)_0%,transparent_70%)] pointer-events-none rtl:[background:radial-gradient(ellipse_60%_80%_at_0%_50%,rgba(232,80,122,0.06)_0%,transparent_70%)]" />
      <div>
        <HeroContent copy={copy} />
        <HeroActions />
        <HeroTrust copy={copy} />
      </div>
      <HeroVisual />
    </section>
  );
}
