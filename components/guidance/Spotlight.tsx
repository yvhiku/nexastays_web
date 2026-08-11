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

type Hole =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | {
      kind: "rect";
      cx: number;
      cy: number;
      x: number;
      y: number;
      w: number;
      h: number;
      rx: number;
    };

type CardPlacement = {
  top?: number;
  bottom?: number;
  left: number;
  caret: "up" | "down";
};

const CARD_MAX_WIDTH = 360;
const CARD_EST_HEIGHT = 240;
const EDGE = 16;

function resolveTarget(selector: string): HTMLElement | null {
  const parts = selector
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const part of parts) {
    const el = document.querySelector<HTMLElement>(
      `[data-guidance-target="${part}"]`,
    );
    if (!el) continue;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    return el;
  }
  return null;
}

function measureTarget(selector: string): Hole | null {
  const el = resolveTarget(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const pad = 10;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // Wide CTAs (e.g. Back to My Bookings) get a rounded-rect spotlight.
  if (rect.width > Math.max(96, rect.height * 1.6)) {
    return {
      kind: "rect",
      cx,
      cy,
      x: rect.left - pad,
      y: rect.top - pad,
      w: rect.width + pad * 2,
      h: rect.height + pad * 2,
      rx: Math.min(18, (rect.height + pad * 2) / 2),
    };
  }

  return {
    kind: "circle",
    cx,
    cy,
    r: Math.max(rect.width, rect.height) / 2 + 14,
  };
}

function holeTop(hole: Hole): number {
  return hole.kind === "circle" ? hole.cy - hole.r : hole.y;
}

function holeBottom(hole: Hole): number {
  return hole.kind === "circle" ? hole.cy + hole.r : hole.y + hole.h;
}

function placeCard(hole: Hole | null, vw: number, vh: number): CardPlacement {
  const width = Math.min(CARD_MAX_WIDTH, vw - EDGE * 2);
  const leftBase = hole ? hole.cx - width / 2 : (vw - width) / 2;
  const left = Math.min(Math.max(EDGE, leftBase), vw - width - EDGE);

  if (!hole) {
    return { bottom: EDGE + 88, left, caret: "down" };
  }

  const spaceAbove = holeTop(hole) - EDGE;
  const spaceBelow = vh - holeBottom(hole) - EDGE;
  const preferAbove = spaceAbove >= CARD_EST_HEIGHT || spaceAbove >= spaceBelow;

  if (preferAbove) {
    const bottom = Math.max(EDGE, vh - (holeTop(hole) - 18));
    return { bottom, left, caret: "down" };
  }

  const top = Math.min(holeBottom(hole) + 18, vh - CARD_EST_HEIGHT - EDGE);
  return { top: Math.max(EDGE, top), left, caret: "up" };
}

export function Spotlight({ guideId, onPrimary, onNotNow, onTargetReady }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const def = GUIDE_BY_ID[guideId];
  const target = def.target ?? "";
  const [hole, setHole] = useState<Hole | null>(null);
  const [viewport, setViewport] = useState({ w: 360, h: 640 });
  const titleId = `guidance-spot-${guideId}`;

  const sync = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    const el = resolveTarget(target);
    onTargetReady?.(el);
    if (!el) {
      setHole(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const inView =
      rect.top >= EDGE &&
      rect.bottom <= window.innerHeight - EDGE &&
      rect.left >= 0 &&
      rect.right <= window.innerWidth;
    if (!inView) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "";
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        setHole(measureTarget(target));
        document.body.style.overflow = prevOverflow || "hidden";
      }, 420);
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
              {hole?.kind === "circle" ? (
                <circle cx={hole.cx} cy={hole.cy} r={hole.r} fill="black" />
              ) : null}
              {hole?.kind === "rect" ? (
                <rect
                  x={hole.x}
                  y={hole.y}
                  width={hole.w}
                  height={hole.h}
                  rx={hole.rx}
                  ry={hole.rx}
                  fill="black"
                />
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

        {hole?.kind === "circle" ? (
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

        {hole?.kind === "rect" ? (
          <motion.div
            className="pointer-events-none absolute border-[3px] border-[#E8507A] shadow-[0_0_12px_rgba(232,80,122,0.6)]"
            style={{
              left: hole.x,
              top: hole.y,
              width: hole.w,
              height: hole.h,
              borderRadius: hole.rx,
            }}
            animate={reduce ? undefined : { opacity: [1, 0.75, 1] }}
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
                "pointer-events-none absolute h-3.5 w-3.5 bg-white",
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
