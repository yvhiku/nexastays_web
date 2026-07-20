"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { GuidanceOverlay } from "@/components/guidance/GuidanceOverlay";
import { GUIDE_BY_ID } from "@/components/guidance/guidance-config";

type Props = {
  onContinue: () => void;
  onNotNow: () => void;
};

export function WelcomeModal({ onContinue, onNotNow }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const def = GUIDE_BY_ID.welcome;
  const titleId = "guidance-welcome-title";

  return (
    <GuidanceOverlay
      className="items-end justify-center sm:items-center"
      onBackdropClick={onNotNow}
      labelledBy={titleId}
    >
      <motion.section
        initial={reduce ? false : { y: "100%", opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full max-w-md rounded-t-[32px] bg-white p-8 shadow-nexa-lg sm:mb-10 sm:rounded-[32px]"
      >
        <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-nexa-line" />
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 aspect-square w-full max-w-sm overflow-hidden rounded-2xl">
            <motion.div
              animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative h-full w-full"
            >
              <Image
                src={def.asset ?? "/guidance/welcom.png"}
                alt=""
                fill
                className="object-contain"
                sizes="400px"
                priority
              />
            </motion.div>
          </div>
          {def.progress ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-nexa-ink-4">
              {t("guidance.progress")
                .replace("{step}", String(def.progress.step))
                .replace("{of}", String(def.progress.of))}
            </p>
          ) : null}
          <h1
            id={titleId}
            className="mb-4 font-display text-[32px] font-bold leading-tight text-nexa-ink"
          >
            {t(def.titleKey)}
          </h1>
          <p className="mb-10 max-w-md text-lg leading-relaxed text-nexa-ink-3">
            {t(def.bodyKey)}
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-xl bg-[#FF5A7D] py-4 text-base font-semibold text-white shadow-lg shadow-[#FF5A7D]/20 transition active:scale-[0.97]"
          >
            {t(def.primaryKey)}
          </button>
          <button
            type="button"
            onClick={onNotNow}
            className="mt-2 w-full py-2 text-base font-medium text-nexa-ink-4"
          >
            {t(def.secondaryKey ?? "guidance.notNow")}
          </button>
        </div>
      </motion.section>
    </GuidanceOverlay>
  );
}
