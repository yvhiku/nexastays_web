"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const bulletKeys = [
  "home.hostCta.bullet1",
  "home.hostCta.bullet2",
  "home.hostCta.bullet3",
  "home.hostCta.bullet4",
];

export const HostCtaSection = () => {
  const { t, localePath } = useLanguage();
  return (
    <section className="py-16 sm:py-20 md:py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-nexa-ink to-nexa-ink-2 rounded-2xl sm:rounded-[32px] p-8 sm:p-12 md:p-16 lg:p-20 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center"
        >
          <div>
            <span className="text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary-light mb-3 block">
              {t("home.hostCta.eyebrow")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
              {t("home.hostCta.title")}
            </h2>
            <p className="text-white/65 max-w-[500px] mb-6">
              {t("home.hostCta.subtitle")}
            </p>
            <div className="flex flex-col gap-2.5 mt-6">
              {bulletKeys.map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-2.5 text-white/80 text-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-nexa-primary-light shrink-0" />
                  {t(key)}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 items-start shrink-0">
            <Button variant="white" size="lg" asChild>
              <Link href={localePath("/host")}>{t("home.hostCta.startHosting")}</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white/80 hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href={localePath("/contact")}>{t("home.hostCta.talkPartnerships")}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
