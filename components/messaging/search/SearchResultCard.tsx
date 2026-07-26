"use client";

import React from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

function highlight(text: string, term: string) {
  const value = term.trim();
  if (!value) return text;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "ig")).map((part, index) =>
    part.toLowerCase() === value.toLowerCase() ? (
      <mark key={index} className="rounded bg-nexa-primary-soft px-0.5 text-nexa-primary">{part}</mark>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    ),
  );
}

export function SearchResultCard({
  icon: Icon,
  eyebrow,
  preview,
  meta,
  actionLabel,
  query,
  onOpen,
}: {
  icon: LucideIcon;
  eyebrow: string;
  preview: string;
  meta?: string;
  actionLabel: string;
  query: string;
  onOpen: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      type="button"
      initial={reduceMotion ? false : { opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="group flex min-h-[92px] w-full items-start gap-3 rounded-xl border border-nexa-line bg-white p-3 text-start shadow-messaging-1 transition-[border-color,box-shadow,transform] duration-messaging-hover hover:-translate-y-px hover:border-nexa-primary/15 hover:shadow-messaging-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 motion-reduce:transform-none"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nexa-primary-soft text-nexa-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-nexa-primary">{eyebrow}</span>
        <span className="mt-1 line-clamp-2 block break-words text-sm leading-5 text-nexa-ink">{highlight(preview, query)}</span>
        <span className="mt-2 flex items-center justify-between gap-2 text-[11px] text-nexa-ink-4">
          <span className="truncate">{meta}</span>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-nexa-primary">{actionLabel}<ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden /></span>
        </span>
      </span>
    </motion.button>
  );
}
