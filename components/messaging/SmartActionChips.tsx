"use client";

import React from "react";
import { ArrowUpRight, Info } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export type SmartAction = {
  id: string;
  label: string;
  onSelect: () => void;
  context?: boolean;
};

export function SmartActionChips({ actions, label }: { actions: SmartAction[]; label: string }) {
  const reduceMotion = useReducedMotion();
  if (!actions.length) return null;
  return (
    <div className="flex shrink-0 flex-wrap gap-2 overflow-hidden px-4 py-2" role="toolbar" aria-label={label}>
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          type="button"
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : index * 0.04 }}
          onClick={action.onSelect}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-nexa-primary/20 bg-white px-3.5 text-xs font-semibold text-nexa-primary shadow-messaging-1 transition-[background-color,box-shadow,transform] hover:bg-nexa-primary-soft hover:shadow-messaging-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
        >
          {action.context ? <Info className="h-3.5 w-3.5" aria-hidden /> : null}
          {action.label}
          {!action.context ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : null}
        </motion.button>
      ))}
    </div>
  );
}
