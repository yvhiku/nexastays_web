"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Zap, WifiOff, Bookmark, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { GuidanceOverlay } from "@/components/guidance/GuidanceOverlay";
import { GUIDE_BY_ID } from "@/components/guidance/guidance-config";
import { PWA_ICONS } from "@/lib/pwa-assets";
import { cn } from "@/lib/utils";

type Props = {
  variant: "ios" | "android";
  /** When false on Android, show Chrome menu steps instead of native prompt(). */
  canNativeInstall?: boolean;
  onPrimary: () => void;
  onNotNow: () => void;
};

export function BottomTip({ variant, canNativeInstall = true, onPrimary, onNotNow }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const def = GUIDE_BY_ID.install_app;
  const titleId = "guidance-install-title";

  if (variant === "ios") {
    return (
      <GuidanceOverlay
        className="items-end justify-center"
        onBackdropClick={onNotNow}
        labelledBy={titleId}
        blur={false}
      >
        <motion.section
          initial={reduce ? false : { y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-lg rounded-t-[32px] border-t border-white/20 bg-white/90 px-6 pt-4 shadow-nexa-lg backdrop-blur-[16px]"
          style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto mb-8 h-1 w-8 rounded-full bg-nexa-line" />
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-8 w-full max-w-[280px]">
              <Image
                src="/guidance/phonemockup.png"
                alt=""
                width={280}
                height={320}
                className="h-auto w-full drop-shadow-2xl"
              />
              <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-3xl text-[#E8507A]"
                animate={reduce ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                aria-hidden
              >
                ↑↑
              </motion.div>
            </div>
            <h2 id={titleId} className="mb-8 font-display text-xl font-semibold">
              {t("guidance.installIosTitle")}
            </h2>
            <div className="mb-10 w-full space-y-4 text-left">
              <div className="flex items-center gap-4 rounded-2xl border border-white/40 bg-white/50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffd9df] font-bold text-nexa-primary">
                  1
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-nexa-ink-3">
                    {t("guidance.step1")}
                  </p>
                  <p className="font-medium">{t("guidance.iosStep1")}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-white/40 bg-white/50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffd9df] font-bold text-nexa-primary">
                  2
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-nexa-ink-3">
                    {t("guidance.step2")}
                  </p>
                  <p className="font-medium">{t("guidance.iosStep2")}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onPrimary}
              className="h-14 w-full rounded-full bg-[#E8507A] font-semibold text-white active:scale-[0.97]"
            >
              {t("guidance.continue")}
            </button>
            <button
              type="button"
              onClick={onNotNow}
              className="mt-2 h-12 w-full font-medium text-nexa-ink-3"
            >
              {t("guidance.notNow")}
            </button>
          </div>
        </motion.section>
      </GuidanceOverlay>
    );
  }

  const features = [
    { icon: Zap, label: t("guidance.installFeatFast") },
    { icon: WifiOff, label: t("guidance.installFeatOffline") },
    { icon: Bookmark, label: t("guidance.installFeatSaved") },
    { icon: Smartphone, label: t("guidance.installFeatNative") },
  ] as const;

  return (
    <GuidanceOverlay
      className="items-end justify-center"
      onBackdropClick={onNotNow}
      labelledBy={titleId}
      blur={false}
    >
      <motion.div
        initial={reduce ? false : { y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "mx-auto flex w-full max-w-md flex-col items-center rounded-t-[32px] px-6 pt-4 sm:mb-8 sm:rounded-[32px]",
          "bg-[rgba(255,247,249,0.85)] shadow-nexa-lg backdrop-blur-[24px]",
        )}
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-8 h-1 w-8 rounded-full bg-nexa-line" />
        <div className="mb-6 h-20 w-20 overflow-hidden rounded-2xl bg-black p-2 shadow-sm">
          <Image
            src={PWA_ICONS.icon192}
            alt=""
            width={80}
            height={80}
            className="h-full w-full object-contain"
          />
        </div>
        <h1 id={titleId} className="mb-2 text-center font-display text-[32px] font-bold">
          {t(def.titleKey)}
        </h1>
        <p className="mb-8 max-w-[280px] text-center text-base leading-relaxed text-nexa-ink-3">
          {t(def.bodyKey)}
        </p>
        {!canNativeInstall ? (
          <div className="mb-8 w-full space-y-4 text-left">
            <p className="text-center text-sm text-nexa-ink-3">{t("guidance.androidInstallHint")}</p>
            <div className="flex items-center gap-4 rounded-2xl border border-white/40 bg-white/50 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffd9df] font-bold text-nexa-primary">
                1
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-nexa-ink-3">
                  {t("guidance.step1")}
                </p>
                <p className="font-medium">{t("guidance.androidStep1")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/40 bg-white/50 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffd9df] font-bold text-nexa-primary">
                2
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-nexa-ink-3">
                  {t("guidance.step2")}
                </p>
                <p className="font-medium">{t("guidance.androidStep2")}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-10 grid w-full grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-start gap-2 rounded-2xl border border-nexa-line bg-[#ffeff8] p-4"
              >
                <Icon className="h-5 w-5 text-nexa-primary" aria-hidden />
                <span className="text-sm font-semibold text-nexa-primary">{label}</span>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onPrimary}
          className="h-14 w-full rounded-full bg-nexa-primary font-semibold text-white active:scale-[0.97]"
        >
          {t(canNativeInstall ? def.primaryKey : "guidance.continue")}
        </button>
        <button
          type="button"
          onClick={onNotNow}
          className="w-full py-3 font-medium text-nexa-ink-3"
        >
          {t("guidance.notNow")}
        </button>
      </motion.div>
    </GuidanceOverlay>
  );
}
