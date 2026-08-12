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

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const locale = getServerLocale(params.locale) as SeoLocale;
  const { t } = getServerTranslations(locale);
  return buildSeoMetadata({
    title: t("seo.staysHubTitle"),
    description: t("seo.staysHubDescription"),
    path: `/${locale}/stays`,
    locale,
  });
}

export default async function StaysHubPage(props: Props) {
  const params = await props.params;
  const locale = getServerLocale(params.locale) as SeoLocale;
  const { t, localePath } = getServerTranslations(locale);
  const destinations = await fetchSeoDestinations();

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen">
        <section className="bg-gradient-to-br from-nexa-primary-soft to-nexa-bg py-12 sm:py-16">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h1 className="font-display text-3xl font-semibold text-nexa-ink sm:text-4xl">
              {t("seo.staysHubHeading")}
            </h1>
            <p className="mt-3 max-w-2xl text-nexa-muted">
              {t("seo.staysHubDescription")}
            </p>
            <p className="mt-5">
              <Link
                href={localePath("/guides")}
                className="inline-flex rounded-xl border border-nexa-primary/30 bg-white/70 px-4 py-2.5 text-sm font-semibold text-nexa-primary hover:bg-white"
              >
                {t("seo.staysHubBrowseGuides")}
              </Link>
            </p>
          </div>
        </section>
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            {destinations.length === 0 ? (
              <div className="rounded-2xl border border-nexa-border bg-white px-6 py-10 text-center">
                <p className="text-base text-nexa-ink">
                  {t("seo.staysHubEmpty")}
                </p>
                <p className="mt-2 text-sm text-nexa-muted">
                  {t("seo.staysHubEmptyHint")}
                </p>
                <Link
                  href={localePath("/listings")}
                  className="mt-5 inline-flex rounded-xl bg-nexa-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                >
                  {t("seo.staysHubBrowseListings")}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {destinations.map((dest) => (
                  <Link
                    key={dest.slug}
                    href={localePath(`/stays/${dest.slug}`)}
                    className="rounded-2xl border border-nexa-border p-5 transition-all hover:border-nexa-primary hover:shadow-nexa-card"
                  >
                    <h2 className="text-lg font-semibold text-nexa-ink">
                      {dest.name}
                    </h2>
                    <p className="mt-1 text-sm text-nexa-muted">
                      {dest.listingCountCache > 0
                        ? t("seo.cityListingCount").replace(
                            "{count}",
                            String(dest.listingCountCache),
                          )
                        : t("seo.exploreCity")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
