import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { getServerLocale, getServerTranslations } from "@/lib/i18n/server";
import { fetchSeoDestinations } from "@/lib/seo/seo-api";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import type { SeoLocale } from "@/lib/seo/types";

export const revalidate = 86400;

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const { t } = getServerTranslations(locale);
  return buildSeoMetadata({
    title: t("seo.staysHubTitle"),
    description: t("seo.staysHubDescription"),
    path: `/${locale}/stays`,
    locale,
  });
}

export default async function StaysHubPage({ params }: Props) {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const { t, localePath } = getServerTranslations(locale);
  const destinations = await fetchSeoDestinations();

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen">
        <section className="py-12 sm:py-16 bg-gradient-to-br from-nexa-primary-soft to-nexa-bg">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-nexa-ink">
              {t("seo.staysHubHeading")}
            </h1>
            <p className="text-nexa-muted mt-3 max-w-2xl">{t("seo.staysHubDescription")}</p>
          </div>
        </section>
        <section className="py-12 sm:py-16">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinations.map((dest) => (
                <Link
                  key={dest.slug}
                  href={localePath(`/stays/${dest.slug}`)}
                  className="rounded-2xl border border-nexa-border p-5 hover:border-nexa-primary hover:shadow-nexa-card transition-all"
                >
                  <h2 className="font-semibold text-lg text-nexa-ink">{dest.name}</h2>
                  <p className="text-sm text-nexa-muted mt-1">
                    {dest.listingCountCache > 0
                      ? t("seo.cityListingCount").replace("{count}", String(dest.listingCountCache))
                      : t("seo.exploreCity")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
