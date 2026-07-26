"use client";

import React from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  title: string;
  address: string;
  actionLabel?: string;
  onOpen?: () => void;
};

export function LocationPreview({ title, address, actionLabel, onOpen }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-nexa-primary-soft text-nexa-primary">
        <MapPin className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-nexa-ink">{title}</h4>
        <p className="mt-1 break-words text-xs leading-5 text-nexa-ink-3">{address}</p>
        {onOpen && actionLabel ? (
          <motion.button
            type="button"
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            onClick={onOpen}
            className="group mt-2 inline-flex min-h-12 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden />
          </motion.button>
        ) : null}
      </div>
    </div>
  );
}
