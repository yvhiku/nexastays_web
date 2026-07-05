"use client";

import React from "react";
import Link from "next/link";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SafetyTransparencyPage() {
  const { t, localePath } = useLanguage();

  const guestPoints = [
    { titleKey: "safety.guestPoint1Title", descKey: "safety.guestPoint1Desc" },
    { titleKey: "safety.guestPoint2Title", descKey: "safety.guestPoint2Desc" },
    { titleKey: "safety.guestPoint3Title", descKey: "safety.guestPoint3Desc" },
    { titleKey: "safety.guestPoint4Title", descKey: "safety.guestPoint4Desc" },
  ];

  const hostPoints = [
    { titleKey: "safety.hostPoint1Title", descKey: "safety.hostPoint1Desc" },
    { titleKey: "safety.hostPoint2Title", descKey: "safety.hostPoint2Desc" },
    { titleKey: "safety.hostPoint3Title", descKey: "safety.hostPoint3Desc" },
    { titleKey: "safety.hostPoint4Title", descKey: "safety.hostPoint4Desc" },
  ];

  return (
    <>
      <NavBar />
      <main className="pt-[72px]">
        <section className="bg-gradient-to-br from-nexa-primary-soft to-nexa-bg pt-16 pb-16 border-b border-nexa-line">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-4">
              {t("safety.badge")}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-nexa-ink mb-5 max-w-[720px]">
              {t("safety.title")}
            </h1>
            <p className="text-lg max-w-[640px] text-nexa-ink-3 mb-8">
              {t("safety.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={localePath("/listings")}>{t("safety.findStay")}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={localePath("/host")}>{t("safety.becomeHost")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-3">
              {t("safety.approachEyebrow")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-nexa-ink mb-4 max-w-[640px]">
              {t("safety.approachTitle")}
            </h2>
            <p className="max-w-[720px] text-nexa-ink-3 mb-6">{t("safety.approachBody")}</p>
            <div className="rounded-2xl bg-nexa-primary-soft border border-nexa-primary/20 p-6 max-w-[720px]">
              <p className="text-sm text-nexa-ink-2 font-medium">{t("safety.coreStatement")}</p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-nexa-bg-2">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-3">
              {t("safety.guestEyebrow")}
            </span>
            <h2 className="text-2xl font-semibold text-nexa-ink mb-8">{t("safety.guestTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guestPoints.map((point) => (
                <div key={point.titleKey} className="bg-white rounded-[22px] border border-nexa-line p-7 shadow-nexa-card">
                  <h3 className="font-semibold text-nexa-ink mb-2">{t(point.titleKey)}</h3>
                  <p className="text-sm text-nexa-ink-3">{t(point.descKey)}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-nexa-ink-3 max-w-[640px]">{t("safety.guestReminder")}</p>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-3">
              {t("safety.hostEyebrow")}
            </span>
            <h2 className="text-2xl font-semibold text-nexa-ink mb-8">{t("safety.hostTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hostPoints.map((point) => (
                <div key={point.titleKey} className="bg-white rounded-[22px] border border-nexa-line p-7 shadow-nexa-card">
                  <h3 className="font-semibold text-nexa-ink mb-2">{t(point.titleKey)}</h3>
                  <p className="text-sm text-nexa-ink-3">{t(point.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
