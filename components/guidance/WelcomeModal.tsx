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
      className="items-end justify-center sm:items-center"
      contentClassName="items-stretch justify-end sm:justify-center sm:items-center"
      onBackdropClick={onNotNow}
      labelledBy={titleId}
    >
      <motion.section
        initial={reduce ? false : { y: 24, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={TRANSITION}
        className={cn(
          "mx-auto flex w-full max-h-[min(90dvh,720px)] flex-col overflow-hidden bg-white shadow-nexa-lg",
          "max-w-md rounded-t-[24px] p-5 pb-6",
          "sm:max-w-lg sm:rounded-[24px] sm:p-6",
          "lg:max-w-3xl lg:grid lg:grid-cols-[42%_58%] lg:rounded-[24px] lg:p-0",
        )}
      >
        <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-nexa-line sm:hidden" />

        <motion.div
          key="welcome-art"
          initial={reduce ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={TRANSITION}
          className={cn(
            "relative shrink-0 overflow-hidden",
            "mx-auto mb-4 aspect-[4/3] w-full max-w-xs rounded-2xl bg-[#FFF8FA]",
            "sm:mb-5 sm:max-w-sm",
            "lg:mb-0 lg:aspect-auto lg:h-full lg:max-w-none lg:rounded-none",
            "lg:bg-gradient-to-br lg:from-[#FFF8FA] lg:via-[#FFF0F4] lg:to-[#FFE8EE]",
          )}
        >
          <div className="relative h-full min-h-[140px] w-full lg:min-h-0 lg:h-full">
            <Image
              src={def.asset ?? "/guidance/welcom.png"}
              alt=""
              fill
              className="object-contain p-4 sm:p-5 lg:p-8"
              sizes="(max-width: 1024px) 90vw, 320px"
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
            "flex min-h-0 flex-1 flex-col items-center overflow-y-auto text-center",
            "lg:items-start lg:justify-center lg:px-10 lg:py-8 lg:text-left",
          )}
        >
          <GuidanceProgressDots
            step={step}
            total={total}
            label={progressLabel}
            className="mb-4 justify-center lg:justify-start"
          />

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-nexa-ink-4">
            {t("guidance.welcomeEyebrow")}
          </p>

          <h1
            id={titleId}
            className="mb-3 max-w-md font-display text-[1.5rem] font-bold leading-tight text-nexa-ink sm:text-[1.75rem] lg:text-[2rem]"
          >
            {t(def.titleKey)}
          </h1>

          <p className="mb-6 max-w-md text-sm leading-relaxed text-nexa-ink-3 sm:text-base lg:mb-8 lg:max-w-sm">
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
