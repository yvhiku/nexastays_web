"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { GuidanceOverlay } from "@/components/guidance/GuidanceOverlay";
import { GuidanceProgressDots } from "@/components/guidance/GuidanceProgressDots";
import { GuidanceDialogActions } from "@/components/guidance/GuidanceDialogActions";
import { GUIDE_BY_ID } from "@/components/guidance/guidance-config";
import { cn } from "@/lib/utils";

type Props = {
  onContinue: () => void;
  onNotNow: () => void;
};

const TRANSITION = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };

export function WelcomeModal({ onContinue, onNotNow }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const def = GUIDE_BY_ID.welcome;
  const titleId = "guidance-welcome-title";
  const step = def.progress?.step ?? 1;
  const total = def.progress?.of ?? 3;
  const progressLabel = t("guidance.stepOf")
    .replace("{step}", String(step))
    .replace("{of}", String(total));

  return (
    <GuidanceOverlay
      className="items-end justify-center md:items-center md:p-6"
      onBackdropClick={onNotNow}
      labelledBy={titleId}
    >
      <motion.section
        initial={reduce ? false : { y: 24, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={TRANSITION}
        className={cn(
          "mx-auto flex w-full flex-col overflow-hidden bg-white shadow-nexa-lg",
          "max-w-md rounded-t-[28px] p-6 pb-8",
          "md:max-w-[700px] md:rounded-[28px] md:p-8",
          "lg:max-h-[550px] lg:max-w-[960px] lg:grid lg:grid-cols-[45%_55%] lg:rounded-[24px] lg:p-0",
        )}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-nexa-line lg:hidden" />

        <motion.div
          key="welcome-art"
          initial={reduce ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={TRANSITION}
          className={cn(
            "relative shrink-0 overflow-hidden",
            "mx-auto mb-6 aspect-[4/3] w-full max-w-sm rounded-2xl bg-[#FFF8FA]",
            "md:mb-8 md:max-w-md",
            "lg:mb-0 lg:aspect-auto lg:h-full lg:max-w-none lg:rounded-none",
            "lg:bg-gradient-to-br lg:from-[#FFF8FA] lg:via-[#FFF0F4] lg:to-[#FFE8EE]",
          )}
        >
          <div className="relative h-full min-h-[180px] w-full lg:min-h-[550px]">
            <Image
              src={def.asset ?? "/guidance/welcom.png"}
              alt=""
              fill
              className="object-contain p-5 md:p-6 lg:p-10"
              sizes="(max-width: 1024px) 90vw, 420px"
              priority
            />
          </div>
        </motion.div>

        <motion.div
          key="welcome-content"
          initial={reduce ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...TRANSITION, delay: reduce ? 0 : 0.05 }}
          className={cn(
            "flex flex-1 flex-col items-center text-center",
            "lg:items-start lg:justify-center lg:px-12 lg:py-10 lg:text-left",
          )}
        >
          <GuidanceProgressDots
            step={step}
            total={total}
            label={progressLabel}
            className="mb-5 justify-center lg:justify-start"
          />

          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-nexa-ink-4">
            {t("guidance.welcomeEyebrow")}
          </p>

          <h1
            id={titleId}
            className="mb-4 max-w-md font-display text-[28px] font-bold leading-tight text-nexa-ink md:text-[32px] lg:text-[36px]"
          >
            {t(def.titleKey)}
          </h1>

          <p className="mb-8 max-w-md text-base leading-relaxed text-nexa-ink-3 md:text-[17px] lg:mb-10 lg:max-w-sm">
            {t(def.bodyKey)}
          </p>

          <div className="mt-auto w-full max-w-md lg:max-w-none">
            <div className="hidden lg:block">
              <GuidanceDialogActions
                skipLabel={t("guidance.skip")}
                continueLabel={t("guidance.continueArrow")}
                onSkip={onNotNow}
                onContinue={onContinue}
                layout="split"
              />
            </div>
            <div className="lg:hidden">
              <GuidanceDialogActions
                skipLabel={t("guidance.skip")}
                continueLabel={t("guidance.continueArrow")}
                onSkip={onNotNow}
                onContinue={onContinue}
                layout="stacked"
              />
            </div>
          </div>
        </motion.div>
      </motion.section>
    </GuidanceOverlay>
  );
}
