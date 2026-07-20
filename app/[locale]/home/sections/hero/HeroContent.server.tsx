import type { ServerTranslations } from "@/lib/i18n/server";
import { RichTextServer } from "@/components/i18n/RichTextServer";

type Props = {
  copy: Pick<ServerTranslations, "t" | "isRtl">;
};

export function HeroContent({ copy }: Props) {
  const { t } = copy;
  return (
    <div className="p-6 sm:p-10 md:p-14 lg:p-16 xl:p-20 xl:ps-16 pb-0 relative z-10">
      <div className="inline-flex items-center gap-2 bg-nexa-primary-soft border border-nexa-primary/20 rounded-full py-1.5 px-4 text-xs font-semibold text-nexa-primary mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-nexa-primary" />
        {t("home.hero.badge")}
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-nexa-ink mb-5 leading-tight">
        <RichTextServer text={t("home.hero.title")} />
      </h1>
      <p className="text-base sm:text-lg text-nexa-ink-3 mb-9 max-w-[460px] leading-relaxed">
        {t("home.hero.subtitle")}
      </p>
    </div>
  );
}

export function HeroTrust({ copy }: Props) {
  const { t } = copy;
  const trustItems = [
    t("home.hero.verifiedHosts"),
    t("home.hero.controlledListings"),
    t("home.hero.clearRules"),
    t("home.hero.protectedAddress"),
  ];

  return (
    <div className="flex gap-6 flex-wrap pt-7 border-t border-nexa-line px-6 sm:px-10 md:px-14 lg:px-16 xl:px-20 xl:ps-16 pb-6 sm:pb-10 md:pb-14 lg:pb-16 xl:pb-20 relative z-10">
      {trustItems.map((item) => (
        <div key={item} className="flex items-center gap-1.5 text-sm text-nexa-ink-4">
          <span className="text-nexa-primary">✓</span> {item}
        </div>
      ))}
    </div>
  );
}
