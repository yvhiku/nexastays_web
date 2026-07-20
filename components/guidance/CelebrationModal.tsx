"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { GuidanceOverlay } from "@/components/guidance/GuidanceOverlay";
import { GUIDE_BY_ID } from "@/components/guidance/guidance-config";
import type { GuideId } from "@/lib/guidance-types";
import { cn } from "@/lib/utils";

type Props = {
  guideId: Extract<GuideId, "save_first" | "booking_success" | "review_celebration">;
  onPrimary: () => void;
  onSecondary: () => void;
};

function Confetti({ active }: { active: boolean }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        color: ["#ae2250", "#ffd9df", "#fdac6f", "#8d4f1a", "#ffffff"][i % 5],
        angle: (Math.PI * 2 * i) / 36,
        dist: 80 + (i % 5) * 28,
        size: 4 + (i % 4),
        delay: (i % 8) * 0.02,
      })),
    [],
  );
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute left-1/2 top-1/2 rounded-sm"
          style={{
            width: b.size,
            height: b.size,
            backgroundColor: b.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: Math.cos(b.angle) * b.dist,
            y: Math.sin(b.angle) * b.dist,
            opacity: 0,
            rotate: 180,
          }}
          transition={{ duration: 1.2, delay: b.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export function CelebrationModal({ guideId, onPrimary, onSecondary }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const def = GUIDE_BY_ID[guideId];
  const titleId = `guidance-${guideId}-title`;
  const [burst, setBurst] = useState(!reduce);

  useEffect(() => {
    if (reduce) return;
    const id = window.setTimeout(() => setBurst(false), 1600);
    return () => window.clearTimeout(id);
  }, [reduce]);

  const floatArt = guideId === "booking_success" || guideId === "review_celebration";

  return (
    <GuidanceOverlay
      className="items-center justify-center p-4"
      onBackdropClick={onSecondary}
      labelledBy={titleId}
      blur
    >
      <Confetti active={burst} />
      <motion.div
        initial={reduce ? false : { scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[440px] overflow-hidden rounded-[32px] bg-white shadow-nexa-lg"
      >
        <div className="relative flex h-64 items-center justify-center overflow-hidden bg-nexa-bg-2">
          <div className="absolute inset-0 scale-125 rounded-full bg-nexa-primary/10 blur-[60px]" />
          <motion.div
            animate={
              reduce
                ? undefined
                : floatArt
                  ? { y: [0, -12, 0] }
                  : { scale: [0.92, 1.05, 1] }
            }
            transition={
              floatArt
                ? { duration: 6, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
            }
            className="relative z-10 h-48 w-48"
          >
            <Image
              src={def.asset ?? "/guidance/save.png"}
              alt=""
              fill
              className="object-contain"
              sizes="200px"
            />
          </motion.div>
        </div>
        <div className="space-y-6 p-8 text-center">
          <h1
            id={titleId}
            className="font-display text-[32px] font-bold leading-tight text-nexa-ink md:text-5xl"
          >
            {t(def.titleKey)}
          </h1>
          <p className="mx-auto max-w-[300px] text-base text-nexa-ink-3 whitespace-pre-line">
            {t(def.bodyKey)}
          </p>
          <button
            type="button"
            onClick={onPrimary}
            className={cn(
              "w-full rounded-full bg-nexa-primary py-4 text-sm font-bold uppercase tracking-wide text-white",
              "active:scale-[0.97]",
            )}
          >
            {t(def.primaryKey)}
          </button>
          <button
            type="button"
            onClick={onSecondary}
            className="w-full rounded-full border border-nexa-line py-4 text-sm font-bold uppercase tracking-wide text-nexa-ink-3 active:scale-[0.97]"
          >
            {t(def.secondaryKey ?? "guidance.continue")}
          </button>
        </div>
        {guideId === "booking_success" ? (
          <div className="h-2 w-full bg-gradient-to-r from-nexa-primary/30 via-nexa-primary to-nexa-primary/30" />
        ) : null}
      </motion.div>
    </GuidanceOverlay>
  );
}
