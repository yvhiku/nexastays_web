"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function SearchSection({
  title,
  count,
  children,
  grid = false,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  grid?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const reduceMotion = useReducedMotion();
  return (
    <section className="border-b border-nexa-line/70 pb-4 last:border-0">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-12 w-full items-center justify-between rounded-xl px-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40" aria-expanded={open}>
        <span className="text-sm font-semibold text-nexa-ink">{title} <span className="text-nexa-ink-4">{count}</span></span>
        <ChevronDown className={`h-4 w-4 text-nexa-ink-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="overflow-hidden"
          >
            <div className={grid ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
