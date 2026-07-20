"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Zap, Bookmark, WifiOff, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { GUIDE_BY_ID } from "@/components/guidance/guidance-config";

type Props = {
  onContinue: () => void;
};

export function InstallSuccessScreen({ onContinue }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const def = GUIDE_BY_ID.install_success;
  const titleId = "guidance-install-success-title";

  const rows = [
    { icon: Zap, title: t("guidance.installSuccessFast"), sub: t("guidance.installSuccessFastSub") },
    {
      icon: Bookmark,
      title: t("guidance.installSuccessSaved"),
      sub: t("guidance.installSuccessSavedSub"),
    },
    {
      icon: WifiOff,
      title: t("guidance.installSuccessOffline"),
      sub: t("guidance.installSuccessOfflineSub"),
    },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fff7f9] px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center space-y-8 text-center">
        <motion.div
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-[#E8507A]/30 text-[#E8507A]"
        >
          <Check className="h-16 w-16" strokeWidth={2.5} />
        </motion.div>
        <h1
          id={titleId}
          className="font-display text-[32px] font-bold text-nexa-primary md:text-5xl"
        >
          {t(def.titleKey)}
        </h1>
        <p className="max-w-sm text-base text-nexa-ink-3">{t(def.bodyKey)}</p>
        <div className="grid w-full grid-cols-1 gap-3 text-left">
          {rows.map(({ icon: Icon, title, sub }) => (
            <div
              key={title}
              className="flex items-center gap-4 rounded-xl border border-white/30 bg-white/60 p-4 backdrop-blur"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffd9df] text-nexa-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="text-xs text-nexa-ink-4">{sub}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-full bg-nexa-primary py-4 font-semibold text-white active:scale-[0.97]"
        >
          {t(def.primaryKey)}
        </button>
      </div>
    </div>
  );
}
