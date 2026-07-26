"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PinnedPropertyCard, type ReservationAction } from "./PinnedPropertyCard";

type Props = {
  conversationId: string;
  label: string;
  title: string;
  dates?: string | null;
  status?: string | null;
  actions: ReservationAction[];
  children?: React.ReactNode;
};

export function CollapsibleReservationSummary(props: Props) {
  const reduceMotion = useReducedMotion();
  const storageKey = `nexa-reservation-summary:${props.conversationId}`;
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try {
      setExpanded(localStorage.getItem(storageKey) !== "collapsed");
    } catch {
      setExpanded(true);
    }
  }, [storageKey]);

  const toggle = () => {
    setExpanded((current) => {
      const next = !current;
      try {
        localStorage.setItem(storageKey, next ? "expanded" : "collapsed");
      } catch {
        /* storage may be unavailable */
      }
      return next;
    });
  };

  return (
    <section className="shrink-0 border-b border-nexa-line/60 bg-white/88 px-3 py-1.5 backdrop-blur-xl sm:px-4" aria-label={props.label}>
      <button
        type="button"
        onClick={toggle}
        className="mx-auto flex min-h-11 w-full max-w-[960px] min-w-0 items-center justify-between gap-3 rounded-xl px-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
        aria-expanded={expanded}
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-nexa-ink-4">{props.label}</span>
          <span className="block truncate text-sm font-semibold text-nexa-ink">{props.title}</span>
        </span>
        <span className="flex min-w-0 shrink-0 items-center gap-2 text-xs font-medium text-nexa-ink-3">
          <span className="hidden max-w-64 truncate sm:inline">{[props.dates, props.status].filter(Boolean).join(" · ")}</span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none", expanded && "rotate-180")} aria-hidden />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mx-auto max-w-[960px] overflow-hidden"
          >
            <div className={cn("grid gap-3 pb-2 pt-1.5", props.children && "md:grid-cols-2")}>
              <PinnedPropertyCard title={props.title} dates={props.dates} status={props.status} actions={props.actions} />
              {props.children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
