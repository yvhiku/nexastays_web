"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { StayExampleCard } from "@/components/home/StayExampleCard";
import { RichText } from "@/components/i18n/RichText";

export const HeroSection = () => {
  const { t, localePath, isRtl } = useLanguage();
  return (
    <section className="min-h-0 md:min-h-screen pt-[72px] grid grid-cols-1 md:grid-cols-2 items-center overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_50%,rgba(232,80,122,0.06)_0%,transparent_70%)] pointer-events-none rtl:[background:radial-gradient(ellipse_60%_80%_at_0%_50%,rgba(232,80,122,0.06)_0%,transparent_70%)]" />
      <div className="p-6 sm:p-10 md:p-14 lg:p-16 xl:p-20 xl:ps-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-nexa-primary-soft border border-nexa-primary/20 rounded-full py-1.5 px-4 text-xs font-semibold text-nexa-primary mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-nexa-primary" />
          {t("home.hero.badge")}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-nexa-ink mb-5 leading-tight"
        >
          <RichText text={t("home.hero.title")} />
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-nexa-ink-3 mb-9 max-w-[460px] leading-relaxed"
        >
          {t("home.hero.subtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap gap-3.5 mb-10"
        >
          <Button size="lg" asChild>
            <Link href={localePath("/listings")}>{t("home.hero.searchStays")}</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href={localePath("/host")}>{t("home.hero.becomeHost")}</Link>
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex gap-6 flex-wrap pt-7 border-t border-nexa-line"
        >
          {[
            t("home.hero.verifiedHosts"),
            t("home.hero.controlledListings"),
            t("home.hero.clearRules"),
            t("home.hero.protectedAddress"),
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm text-nexa-ink-4">
              <span className="text-nexa-primary">✓</span> {item}
            </div>
          ))}
        </motion.div>
      </div>
      <div className="h-auto min-h-[320px] py-10 md:py-0 md:h-screen bg-gradient-to-br from-[#f9d8e3] via-[#fce7d3] to-[#f8d4e3] flex items-center justify-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative w-full max-w-[340px] h-[360px] sm:h-[400px] md:h-[420px] mx-auto"
        >
          <div className="absolute inset-0 bg-white rounded-[22px] shadow-nexa-lg overflow-hidden">
            <StayExampleCard layout="hero" />
          </div>
          <div className="absolute -bottom-20 -end-5 bg-white rounded-full py-2.5 px-4 shadow-nexa-md flex items-center gap-2 text-xs font-semibold whitespace-nowrap max-w-[220px]">
            <span>📋</span> {t("home.hero.previewStatus")}
          </div>
          <p
            className={cn(
              "absolute -top-24 inset-x-0 text-center text-xs text-nexa-ink-3 px-4 max-w-[280px] mx-auto",
              isRtl && "leading-relaxed"
            )}
          >
            {t("home.hero.previewNote")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};
