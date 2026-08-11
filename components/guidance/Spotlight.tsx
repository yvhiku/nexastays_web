"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { GUIDE_BY_ID } from "@/components/guidance/guidance-config";
import type { GuideId } from "@/lib/guidance-types";
import { cn } from "@/lib/utils";
import { OverlayPortal } from "@/components/ui/OverlayPortal";

type Props = {
  guideId: Extract<GuideId, "search_fab" | "saved_tab" | "trips_tab">;
  onPrimary: () => void;
  onNotNow: () => void;
  /** Extra class when highlighting search FAB (parent can add glow). */
  onTargetReady?: (el: HTMLElement | null) => void;
};

type Rect = { cx: number; cy: number; r: number };

type CardPlacement = {
  top?: number;
  bottom?: number;
  left: number;
  caret: "up" | "down";
};

const CARD_MAX_WIDTH = 360;
const CARD_EST_HEIGHT = 240;
const EDGE = 16;

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

function placeCard(hole: Rect | null, vw: number, vh: number): CardPlacement {
  const width = Math.min(CARD_MAX_WIDTH, vw - EDGE * 2);
  const leftBase = hole ? hole.cx - width / 2 : (vw - width) / 2;
  const left = Math.min(Math.max(EDGE, leftBase), vw - width - EDGE);

  if (!hole) {
    return { bottom: EDGE + 88, left, caret: "down" };
  }

  const spaceAbove = hole.cy - hole.r - EDGE;
  const spaceBelow = vh - (hole.cy + hole.r) - EDGE;
  const preferAbove = spaceAbove >= CARD_EST_HEIGHT || spaceAbove >= spaceBelow;

  if (preferAbove) {
    const bottom = Math.max(EDGE, vh - (hole.cy - hole.r - 18));
    return { bottom, left, caret: "down" };
  }

  const top = Math.min(hole.cy + hole.r + 18, vh - CARD_EST_HEIGHT - EDGE);
  return { top: Math.max(EDGE, top), left, caret: "up" };
}

export function Spotlight({ guideId, onPrimary, onNotNow, onTargetReady }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const def = GUIDE_BY_ID[guideId];
  const target = def.target ?? "";
  const [hole, setHole] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 360, h: 640 });
  const titleId = `guidance-spot-${guideId}`;

  const sync = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    const el = document.querySelector<HTMLElement>(
      `[data-guidance-target="${target}"]`,
    );
    onTargetReady?.(el);
    if (!el) {
      setHole(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
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

  const placement = useMemo(
    () => placeCard(hole, viewport.w, viewport.h),
    [hole, viewport.w, viewport.h],
  );

  const cardWidth = Math.min(CARD_MAX_WIDTH, viewport.w - EDGE * 2);
  const caretLeft = hole
    ? Math.min(Math.max(28, hole.cx - placement.left), cardWidth - 28)
    : cardWidth / 2;

  return (
    <OverlayPortal layer="modal">
      <div
        className="fixed inset-0 z-layer-modal"
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

        <div
          className="absolute z-layer-content"
          style={{
            width: cardWidth,
            left: placement.left,
            top: placement.top,
            bottom: placement.bottom,
          }}
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, y: placement.caret === "down" ? 16 : -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="relative rounded-2xl bg-white p-5 shadow-nexa-lg sm:rounded-[24px] sm:p-6"
            aria-live="polite"
          >
            <div
              className={cn(
                "pointer-events-none absolute h-3.5 w-3.5 rotate-45 bg-white",
                placement.caret === "down" ? "-bottom-1.5" : "-top-1.5",
              )}
              style={{ left: caretLeft, transform: "translateX(-50%) rotate(45deg)" }}
              aria-hidden
            />
            <h2
              id={titleId}
              className="mb-2 font-display text-xl font-bold text-nexa-ink-2 sm:text-2xl"
            >
              {t(def.titleKey)}
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-nexa-ink-3 sm:mb-6 sm:text-base">
              {t(def.bodyKey)}
            </p>
            <button
              type="button"
              onClick={onPrimary}
              className="w-full rounded-full bg-[#E8507A] py-3.5 text-base font-bold text-white shadow-[0_4px_12px_rgba(232,80,122,0.3)] active:scale-[0.97]"
            >
              {t(def.primaryKey)}
            </button>
            <button
              type="button"
              onClick={onNotNow}
              className="mt-1.5 w-full py-2 text-sm font-semibold text-nexa-ink-4"
            >
              {t(def.secondaryKey ?? "guidance.notNow")}
            </button>
          </motion.div>
        </div>
      </div>
    </OverlayPortal>
  );
}
