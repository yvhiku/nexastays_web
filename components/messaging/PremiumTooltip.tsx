"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import {
  MESSAGING_EASE_OUT,
  MESSAGING_MOTION,
} from "@/lib/messaging/motion";

export function PremiumTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const reduceMotion = useReducedMotion();

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const show = () => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        left: Math.max(24, Math.min(window.innerWidth - 24, rect.left + rect.width / 2)),
        top: rect.bottom + 8,
      });
      setVisible(true);
    }, 300);
  };

  const hide = () => {
    clearTimer();
    setVisible(false);
  };

  useEffect(() => () => clearTimer(), []);

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex"
        aria-describedby={visible ? id : undefined}
        onPointerEnter={show}
        onPointerLeave={hide}
        onFocusCapture={show}
        onBlurCapture={hide}
      >
        {children}
      </span>
      {visible ? (
        <OverlayPortal layer="tooltip">
          <motion.span
            id={id}
            role="tooltip"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : MESSAGING_MOTION.button,
              ease: MESSAGING_EASE_OUT,
            }}
            className="pointer-events-none fixed -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/70 bg-nexa-ink/92 px-3 py-2 text-xs font-semibold text-white shadow-messaging-3 backdrop-blur-xl"
            style={position}
          >
            {label}
          </motion.span>
        </OverlayPortal>
      ) : null}
    </>
  );
}
