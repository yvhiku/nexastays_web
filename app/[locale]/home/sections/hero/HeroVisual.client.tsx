"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { StayExampleCard } from "@/components/home/StayExampleCard";

export function HeroVisual() {
  const { t, isRtl } = useLanguage();

  return (
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
            isRtl && "leading-relaxed",
          )}
        >
          {t("home.hero.previewNote")}
        </p>
      </motion.div>
    </div>
  );
}
