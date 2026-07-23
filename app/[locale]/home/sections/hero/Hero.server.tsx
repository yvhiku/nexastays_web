import type { Locale } from "@/lib/i18n";
import { getServerTranslations } from "@/lib/i18n/server";
import { HeroContent, HeroTrust } from "./HeroContent.server";
import { HeroActions } from "./HeroActions.client";
import { HeroVisual } from "./HeroVisualLazy.client";

type Props = {
  locale: Locale;
  embedSearch?: React.ReactNode;
};

export function HeroSection({ locale, embedSearch }: Props) {
  const copy = getServerTranslations(locale);

  return (
    <section className="min-h-0 pt-[72px] overflow-hidden relative">
      {embedSearch ? (
        <div className="hidden lg:block border-b border-nexa-line bg-nexa-bg-2 py-6 relative z-10">
          {embedSearch}
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 items-center relative md:min-h-0 lg:min-h-[calc(100vh-72px-120px)] lg:max-h-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_50%,rgba(232,80,122,0.06)_0%,transparent_70%)] pointer-events-none rtl:[background:radial-gradient(ellipse_60%_80%_at_0%_50%,rgba(232,80,122,0.06)_0%,transparent_70%)]" />
      <div>
        <HeroContent copy={copy} />
        <HeroActions />
        <HeroTrust copy={copy} />
      </div>
      <HeroVisual />
      </div>
    </section>
  );
}
