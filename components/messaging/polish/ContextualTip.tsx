"use client";

import React, { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function ContextualTip({
  id,
  text,
  dismissLabel,
}: {
  id: string;
  text: string;
  dismissLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();
  const storageKey = `nexa-messaging-tip:${id}`;

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(storageKey) !== "dismissed");
    } catch {
      setVisible(true);
    }
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, "dismissed");
    } catch {
      /* storage may be unavailable */
    }
  };

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.aside
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mx-auto mb-3 flex min-h-12 w-full max-w-[920px] items-center gap-3 rounded-2xl border border-[var(--conversation-accent-border,rgba(232,80,122,0.15))] bg-white/85 px-3 py-2 text-xs text-nexa-ink-2 shadow-messaging-1 backdrop-blur"
          role="note"
        >
          <Lightbulb className="h-4 w-4 shrink-0 text-[var(--conversation-accent,#e8507a)]" aria-hidden />
          <p className="min-w-0 flex-1 leading-5">{text}</p>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-nexa-ink-3 hover:bg-nexa-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/45"
            aria-label={dismissLabel}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
