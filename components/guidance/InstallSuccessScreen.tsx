"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Zap, Bookmark, WifiOff, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { GUIDE_BY_ID } from "@/components/guidance/guidance-config";
import { OverlayPortal } from "@/components/ui/OverlayPortal";

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
    <OverlayPortal layer="modal">
      <div className="fixed inset-0 z-layer-modal flex flex-col items-center justify-center overflow-y-auto bg-[#fff7f9] px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex w-full max-w-md flex-col items-center space-y-6 text-center sm:space-y-8">
          <motion.div
            initial={reduce ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#E8507A]/30 text-[#E8507A] sm:h-28 sm:w-28"
          >
            <Check className="h-12 w-12 sm:h-14 sm:w-14" strokeWidth={2.5} />
          </motion.div>
          <h1
            id={titleId}
            className="font-display text-[1.75rem] font-bold text-nexa-primary sm:text-[2rem]"
          >
            {t(def.titleKey)}
          </h1>
          <p className="max-w-sm text-sm text-nexa-ink-3 sm:text-base">{t(def.bodyKey)}</p>
          <div className="grid w-full grid-cols-1 gap-2.5 text-left">
            {rows.map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-xl border border-white/30 bg-white/60 p-3.5 backdrop-blur sm:gap-4 sm:p-4"
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
            className="w-full rounded-full bg-nexa-primary py-3.5 font-semibold text-white active:scale-[0.97]"
          >
            {t(def.primaryKey)}
          </button>
        </div>
      </div>
    </OverlayPortal>
  );
}
