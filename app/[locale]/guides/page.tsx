import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { getServerLocale, getServerTranslations } from "@/lib/i18n/server";
import { fetchSeoGuides, guideTypeLabel } from "@/lib/seo/guide-api";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import type { SeoGuideType, SeoLocale } from "@/lib/seo/types";

export const revalidate = 86400;

type Props = { params: { locale: string } };

const GUIDE_TYPES: SeoGuideType[] = ["travel", "experience", "seasonal", "event"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const { t } = getServerTranslations(locale);
  return buildSeoMetadata({
    title: t("seo.guidesHubTitle"),
    description: t("seo.guidesHubDescription"),
    path: `/${locale}/guides`,
    locale,
  });
}

export default async function GuidesHubPage({ params }: Props) {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const { t, localePath } = getServerTranslations(locale);
  const guides = await fetchSeoGuides(locale);

  const byType = GUIDE_TYPES.map((type) => ({
    type,
    items: guides.filter((g) => g.guideType === type),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen">
        <section className="py-12 sm:py-16 bg-gradient-to-br from-nexa-primary-soft to-nexa-bg">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-nexa-ink">
              {t("seo.guidesHubHeading")}
            </h1>
            <p className="text-nexa-muted mt-3 max-w-2xl">{t("seo.guidesHubDescription")}</p>
          </div>
        </section>

        {byType.map(({ type, items }) => (
          <section key={type} className="py-10 sm:py-12 border-b border-nexa-border/60 last:border-0">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-nexa-ink mb-6">
                {guideTypeLabel(type, t)}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={localePath(guide.href.replace(/^\/(en|fr|ar)/, ""))}
                    className="rounded-2xl border border-nexa-border p-5 hover:border-nexa-primary hover:shadow-nexa-card transition-all"
                  >
                    <h3 className="font-semibold text-lg text-nexa-ink">{guide.title}</h3>
                    {guide.destinationName && (
                      <p className="text-xs text-nexa-muted mt-1">{guide.destinationName}</p>
                    )}
                    {guide.description && (
                      <p className="text-sm text-nexa-muted mt-2 line-clamp-2">{guide.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
