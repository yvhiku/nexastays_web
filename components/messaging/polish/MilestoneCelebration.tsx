"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function MilestoneCelebration({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.18 }}
      className="flex items-start gap-3 rounded-2xl border border-nexa-primary/15 bg-[linear-gradient(145deg,#fff,#fdf0f3)] p-4 shadow-messaging-1"
      role="status"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nexa-primary-soft text-nexa-primary">
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="font-display text-base font-semibold text-nexa-ink">{title}</p>
        {body ? <p className="mt-1 text-xs leading-5 text-nexa-ink-3">{body}</p> : null}
      </div>
    </motion.div>
  );
}
