"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { StayExampleCard } from "@/components/home/StayExampleCard";

const steps = [
  { num: "1", titleKey: "home.howItWorks.step1Title", descKey: "home.howItWorks.step1Desc" },
  { num: "2", titleKey: "home.howItWorks.step2Title", descKey: "home.howItWorks.step2Desc" },
  { num: "3", titleKey: "home.howItWorks.step3Title", descKey: "home.howItWorks.step3Desc" },
  { num: "4", titleKey: "home.howItWorks.step4Title", descKey: "home.howItWorks.step4Desc" },
];

export const HowItWorksSection = () => {
  const { t, localePath } = useLanguage();
  return (
    <section id="how" className="py-16 sm:py-20 md:py-24 bg-nexa-bg-2">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-4">
              {t("home.howItWorks.eyebrow")}
            </span>
            <div className="w-12 h-0.5 bg-gradient-to-r from-nexa-primary to-nexa-accent rounded-sm my-5" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-nexa-ink mb-4">
              {t("home.howItWorks.title1")}
              <br />
              {t("home.howItWorks.title2")}
            </h2>
            <p className="mb-10">
              {t("home.howItWorks.subtitle")}
            </p>
            <div className="flex flex-col gap-8">
              {steps.map((step, i) => (
                <div key={step.num} className="flex gap-5">
                  <div className="shrink-0 w-11 h-11 rounded-full bg-nexa-primary text-white font-bold text-base flex items-center justify-center shadow-[0_4px_12px_rgba(232,80,122,.32)]">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-nexa-ink mb-1">
                      {t(step.titleKey)}
                    </h3>
                    <p className="text-sm">{t(step.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-9" asChild>
              <Link href={localePath("/listings")}>{t("home.howItWorks.startExploring")}</Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl sm:rounded-[32px] shadow-nexa-lg h-[320px] sm:h-[400px] lg:h-[520px] relative min-h-[280px] isolate overflow-hidden"
          >
            <StayExampleCard layout="panel" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
