"use client";

import React from "react";
import Link from "next/link";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStaysFees } from "@/contexts/StaysFeeContext";
import Image from "next/image";

export default function AboutPage() {
  const { t, localePath } = useLanguage();
  const { rates } = useStaysFees();
  return (
    <>
      <NavBar />
      <main>
        <section className="min-h-[60vh] flex items-center pt-[72px] bg-gradient-to-br from-nexa-primary-soft to-nexa-bg">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="max-w-[700px]">
              <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-4">
                {t("about.ourStory")}
              </span>
              <div className="w-12 h-0.5 bg-gradient-to-r from-nexa-primary to-nexa-accent rounded-sm my-4" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-nexa-ink mb-5">
                {t("about.title")}
              </h1>
              <p className="text-lg max-w-[560px]">
                {t("about.subtitle")}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-24">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
              <div>
                <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-4">
                  {t("about.theProblem")}
                </span>
                <div className="w-12 h-0.5 bg-gradient-to-r from-nexa-primary to-nexa-accent rounded-sm my-4" />
                <h2 className="text-2xl font-semibold text-nexa-ink mb-4">
                  {t("about.problemTitle")}
                </h2>
                <p className="mb-7">
                  {t("about.problemBody")}
                </p>
                <Button asChild>
                  <Link href={localePath("/listings")}>{t("about.seeSolution")}</Link>
                </Button>
              </div>
              <div className="bg-nexa-bg-2 rounded-[32px] p-6 sm:p-10">
                <h3 className="font-semibold mb-1">{t("about.forGuests")}</h3>
                <div className="flex flex-col gap-3 mt-5">
                  {[
                    t("about.guest1"),
                    t("about.guest2"),
                    t("about.guest3"),
                    t("about.guest4"),
                  ].map((item, i) => (
                    <div
                      key={`guest-${i}`}
                      className="flex items-start gap-2.5 py-3 px-4 bg-white rounded-xl border-l-[3px] border-nexa-primary text-sm text-nexa-ink-3"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <h3 className="font-semibold mb-1 mt-4">{t("about.forHosts")}</h3>
                <div className="flex flex-col gap-3 mt-5">
                  {[
                    t("about.host1"),
                    t("about.host2"),
                    t("about.host3"),
                  ].map((item, i) => (
                    <div
                      key={`host-${i}`}
                      className="flex items-start gap-2.5 py-3 px-4 bg-white rounded-xl border-l-[3px] border-nexa-primary text-sm text-nexa-ink-3"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-24 bg-nexa-bg-2">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="text-center mb-14">
              <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-3">
                {t("about.ourApproach")}
              </span>
              <h2 className="text-3xl font-semibold text-nexa-ink mb-4">
                {t("about.approachTitle")}
              </h2>
              <p className="max-w-[520px] mx-auto">
                {t("about.approachSubtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {[
                { num: "01", titleKey: "about.pillar1Title", descKey: "about.pillar1Desc" },
                { num: "02", titleKey: "about.pillar2Title", descKey: "about.pillar2Desc" },
                { num: "03", titleKey: "about.pillar3Title", descKey: "about.pillar3Desc" },
              ].map((pillar) => (
                <div
                  key={pillar.num}
                  className="bg-white rounded-[22px] border border-nexa-line p-9 pt-8 shadow-nexa-card hover:-translate-y-1 hover:shadow-nexa-md transition-all"
                >
                  <div className="font-display text-4xl font-bold text-nexa-primary opacity-20 leading-none mb-3">
                    {pillar.num}
                  </div>
                  <h3 className="text-lg font-semibold text-nexa-ink mb-2.5">
                    {t(pillar.titleKey)}
                  </h3>
                  <p className="text-sm text-nexa-ink-3">{t(pillar.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-24">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="bg-gradient-to-br from-nexa-ink to-nexa-ink-2 rounded-2xl sm:rounded-[32px] p-8 sm:p-12 md:p-16 lg:px-20 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              <div>
                <span className="text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary-light block mb-4">
                  {t("about.privacyByDesign")}
                </span>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {t("about.privacyTitle")}
                </h2>
                <p className="text-white/65 mb-7">
                  {t("about.privacyBody")}
                </p>
                <div className="flex flex-col gap-3 mt-7">
                  {[
                    t("about.privacyRule1"),
                    t("about.privacyRule2"),
                    t("about.privacyRule3"),
                    t("about.privacyRule4"),
                  ].map((rule, i) => (
                    <div
                      key={`rule-${i}`}
                      className="flex items-center gap-2.5 text-white/80 text-sm"
                    >
                      {rule}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center gap-6">
                <div className="bg-nexa-primary-soft border border-nexa-primary/20 rounded-[22px] p-6 sm:p-10 text-center">
                  <div className="font-display text-6xl font-bold text-nexa-primary leading-none">
                    {rates.guest_fee_percent}%
                  </div>
                  <div className="text-base text-nexa-ink-3 mt-2">
                    {t("about.guestFeeLabel")}
                  </div>
                </div>
                <div className="bg-white/10 rounded-[22px] p-6">
                  <p className="text-white/70 text-sm">
                    {t("about.feeSplitNote")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-24 bg-nexa-bg-2">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
              <div className="relative rounded-[32px] overflow-hidden shadow-nexa-lg aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&q=80"
                  alt="Stay"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div>
                <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-4">
                  {t("about.betterMatching")}
                </span>
                <div className="w-12 h-0.5 bg-gradient-to-r from-nexa-primary to-nexa-accent rounded-sm my-4" />
                <h2 className="text-2xl font-semibold text-nexa-ink mb-4">
                  {t("about.matchingTitle")}
                </h2>
                <p className="mb-6">
                  {t("about.matchingBody")}
                </p>
                <div className="flex flex-wrap gap-2.5 mt-5">
                  {[
                    "🐾 Pet-friendly",
                    "🤫 Quiet building",
                    "👨‍👩‍👧 Family-ready",
                    "💑 Couples welcome",
                    "💻 Work-friendly Wi-Fi",
                  ].map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-nexa-primary-soft text-nexa-primary"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-24">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="bg-nexa-primary rounded-[32px] p-14 px-18 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-3">
                  {t("about.partnerCta")}
                </h2>
                <p className="text-white/75">
                  {t("about.partnerBody")}
                </p>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <Button variant="white" size="lg" asChild>
                  <Link href={localePath("/contact")}>{t("about.contactPartnerships")}</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/40 text-white/85 hover:bg-white/10"
                  asChild
                >
                  <Link href={localePath("/host")}>{t("about.startHosting")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
