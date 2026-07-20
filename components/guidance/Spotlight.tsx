"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { GUIDE_BY_ID } from "@/components/guidance/guidance-config";
import type { GuideId } from "@/lib/guidance-types";
import { cn } from "@/lib/utils";

type Props = {
  guideId: Extract<GuideId, "search_fab" | "saved_tab" | "trips_tab">;
  onPrimary: () => void;
  onNotNow: () => void;
  /** Extra class when highlighting search FAB (parent can add glow). */
  onTargetReady?: (el: HTMLElement | null) => void;
};

type Rect = { cx: number; cy: number; r: number };

function measureTarget(selector: string): Rect | null {
  const el = document.querySelector<HTMLElement>(
    `[data-guidance-target="${selector}"]`,
  );
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
    r: Math.max(rect.width, rect.height) / 2 + 14,
  };
}

export function Spotlight({ guideId, onPrimary, onNotNow, onTargetReady }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const def = GUIDE_BY_ID[guideId];
  const target = def.target ?? "";
  const [hole, setHole] = useState<Rect | null>(null);
  const titleId = `guidance-spot-${guideId}`;

  const sync = useCallback(() => {
    const el = document.querySelector<HTMLElement>(
      `[data-guidance-target="${target}"]`,
    );
    onTargetReady?.(el);
    if (!el) {
      setHole(null);
      return;
    }
    const inView =
      el.getBoundingClientRect().top >= 0 &&
      el.getBoundingClientRect().bottom <= window.innerHeight;
    if (!inView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => setHole(measureTarget(target)), 400);
    } else {
      setHole(measureTarget(target));
    }
  }, [target, onTargetReady]);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
      onTargetReady?.(null);
    };
  }, [sync, onTargetReady]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onNotNow();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onNotNow]);

  const cardBottom =
    guideId === "search_fab" || guideId === "saved_tab" || guideId === "trips_tab"
      ? "bottom-[140px]"
      : "bottom-24";

  return (
    <div
      className="fixed inset-0 z-[85]"
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <mask id={`guidance-mask-${guideId}`}>
            <rect fill="white" width="100%" height="100%" />
            {hole ? (
              <circle cx={hole.cx} cy={hole.cy} r={hole.r} fill="black" />
            ) : null}
          </mask>
        </defs>
        <rect
          fill="rgba(26,17,24,0.55)"
          width="100%"
          height="100%"
          mask={`url(#guidance-mask-${guideId})`}
        />
      </svg>

      {hole ? (
        <motion.div
          className="pointer-events-none absolute rounded-full border-[3px] border-[#E8507A] shadow-[0_0_12px_rgba(232,80,122,0.6)]"
          style={{
            width: hole.r * 2,
            height: hole.r * 2,
            left: hole.cx,
            top: hole.cy,
            transform: "translate(-50%, -50%)",
          }}
          animate={reduce ? undefined : { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      <div className={cn("absolute left-6 right-6 z-10", cardBottom)}>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="relative rounded-[32px] bg-white p-8 shadow-nexa-lg"
          aria-live="polite"
        >
          <div className="absolute -bottom-2 left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 rounded-sm bg-white" />
          <h2
            id={titleId}
            className="mb-3 font-display text-[28px] font-bold text-nexa-ink-2 sm:text-[32px]"
          >
            {t(def.titleKey)}
          </h2>
          <p className="mb-8 text-base leading-relaxed text-nexa-ink-3">{t(def.bodyKey)}</p>
          <button
            type="button"
            onClick={onPrimary}
            className="w-full rounded-full bg-[#E8507A] py-4 text-lg font-bold text-white shadow-[0_4px_12px_rgba(232,80,122,0.3)] active:scale-[0.97]"
          >
            {t(def.primaryKey)}
          </button>
          <button
            type="button"
            onClick={onNotNow}
            className="mt-2 w-full py-2 font-semibold text-nexa-ink-4"
          >
            {t(def.secondaryKey ?? "guidance.notNow")}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
