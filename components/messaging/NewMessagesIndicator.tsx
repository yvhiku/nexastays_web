"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { MESSAGING_EASE_OUT, MESSAGING_MOTION } from "@/lib/messaging/motion";

type Props = {
  count: number;
  label: string;
  onClick: () => void;
};

export function NewMessagesIndicator({ count, label, onClick }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {count > 0 ? (
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-4 z-layer-sticky flex justify-center px-4"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
          transition={{ duration: reduceMotion ? 0 : MESSAGING_MOTION.message, ease: MESSAGING_EASE_OUT }}
        >
          <button
            type="button"
            onClick={onClick}
            className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-nexa-primary/15 bg-white/95 px-4 text-sm font-semibold text-nexa-primary shadow-messaging-2 backdrop-blur-xl transition-[box-shadow,transform,background-color] duration-messaging-hover hover:-translate-y-px hover:bg-nexa-primary-soft hover:shadow-messaging-3 active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/45 focus-visible:ring-offset-2"
            aria-label={label}
          >
            <ChevronDown className="h-4 w-4 stroke-[1.75]" aria-hidden />
            <span>{label}</span>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
