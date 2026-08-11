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
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        color: ["#ae2250", "#ffd9df", "#fdac6f", "#8d4f1a", "#ffffff"][i % 5],
        angle: (Math.PI * 2 * i) / 28,
        dist: 64 + (i % 5) * 22,
        size: 4 + (i % 3),
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
          className="absolute left-1/2 top-[28%] rounded-sm"
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
          transition={{ duration: 1.1, delay: b.delay, ease: "easeOut" }}
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
      className="items-center justify-center"
      contentClassName="justify-center"
      onBackdropClick={onSecondary}
      labelledBy={titleId}
      blur
    >
      <Confetti active={burst} />
      <motion.div
        initial={reduce ? false : { scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative mx-auto flex w-full max-w-[min(100%,380px)] flex-col overflow-hidden",
          "max-h-[min(88dvh,640px)] rounded-[24px] bg-white shadow-nexa-lg sm:rounded-[28px]",
        )}
      >
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden bg-nexa-bg-2",
            "h-36 sm:h-44",
          )}
        >
          <div className="absolute inset-0 scale-125 rounded-full bg-nexa-primary/10 blur-[50px]" />
          <motion.div
            animate={
              reduce
                ? undefined
                : floatArt
                  ? { y: [0, -8, 0] }
                  : { scale: [0.94, 1.04, 1] }
            }
            transition={
              floatArt
                ? { duration: 6, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
            }
            className="relative z-layer-content h-28 w-28 sm:h-36 sm:w-36"
          >
            <Image
              src={def.asset ?? "/guidance/save.png"}
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 640px) 112px, 144px"
            />
          </motion.div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 text-center sm:gap-5 sm:px-7 sm:py-6">
          <div className="space-y-2 sm:space-y-3">
            <h1
              id={titleId}
              className="font-display text-[1.5rem] font-bold leading-tight text-nexa-ink sm:text-[1.75rem]"
            >
              {t(def.titleKey)}
            </h1>
            <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-nexa-ink-3 whitespace-pre-line sm:text-base">
              {t(def.bodyKey)}
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-2.5 pt-1">
            <button
              type="button"
              onClick={onPrimary}
              className={cn(
                "w-full rounded-full bg-nexa-primary py-3.5 text-sm font-bold uppercase tracking-wide text-white",
                "active:scale-[0.97]",
              )}
            >
              {t(def.primaryKey)}
            </button>
            <button
              type="button"
              onClick={onSecondary}
              className="w-full rounded-full border border-nexa-line py-3.5 text-sm font-bold uppercase tracking-wide text-nexa-ink-3 active:scale-[0.97]"
            >
              {t(def.secondaryKey ?? "guidance.continue")}
            </button>
          </div>
        </div>

        {guideId === "booking_success" ? (
          <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-nexa-primary/30 via-nexa-primary to-nexa-primary/30" />
        ) : null}
      </motion.div>
    </GuidanceOverlay>
  );
}
