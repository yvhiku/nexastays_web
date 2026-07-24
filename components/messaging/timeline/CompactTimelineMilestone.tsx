"use client";

import React from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { executeCardAction, type CardAction } from "@/lib/messaging/actions/registry";

export type MilestoneTone =
  | "booking"
  | "checkin"
  | "checkout"
  | "payment"
  | "review"
  | "support"
  | "neutral";

type Props = {
  icon: LucideIcon;
  title: string;
  body?: string | null;
  time?: string | null;
  action?: CardAction;
  localePath: (path: string) => string;
  tone?: MilestoneTone;
  size?: "compact" | "featured";
};

const TONES: Record<
  MilestoneTone,
  { card: string; icon: string; action: string }
> = {
  booking: {
    card: "border-nexa-primary/15 bg-[linear-gradient(145deg,#fff,#fff7f9)]",
    icon: "border-nexa-primary/15 bg-nexa-primary-soft text-nexa-primary",
    action: "text-nexa-primary hover:bg-nexa-primary-soft",
  },
  checkin: {
    card: "border-sky-100 bg-[linear-gradient(145deg,#fff,#f6fbff)]",
    icon: "border-sky-100 bg-sky-50 text-sky-600",
    action: "text-sky-700 hover:bg-sky-50",
  },
  checkout: {
    card: "border-emerald-100 bg-[linear-gradient(145deg,#fff,#f5fcf8)]",
    icon: "border-emerald-100 bg-emerald-50 text-emerald-600",
    action: "text-emerald-700 hover:bg-emerald-50",
  },
  payment: {
    card: "border-orange-100 bg-[linear-gradient(145deg,#fff,#fff9f3)]",
    icon: "border-orange-100 bg-orange-50 text-orange-600",
    action: "text-orange-700 hover:bg-orange-50",
  },
  review: {
    card: "border-amber-100 bg-[linear-gradient(145deg,#fff,#fffbf1)]",
    icon: "border-amber-100 bg-amber-50 text-amber-600",
    action: "text-amber-700 hover:bg-amber-50",
  },
  support: {
    card: "border-violet-100 bg-[linear-gradient(145deg,#fff,#faf7ff)]",
    icon: "border-violet-100 bg-violet-50 text-violet-600",
    action: "text-violet-700 hover:bg-violet-50",
  },
  neutral: {
    card: "border-nexa-line/80 bg-[linear-gradient(145deg,#fff,#fcf9fa)]",
    icon: "border-nexa-line bg-nexa-bg-2 text-nexa-ink-3",
    action: "text-nexa-ink-2 hover:bg-nexa-bg-2",
  },
};

export function CompactTimelineMilestone({
  icon: Icon,
  title,
  body,
  time,
  action,
  localePath,
  tone = "neutral",
  size = "compact",
}: Props) {
  const { locale } = useLanguage();
  const reduceMotion = useReducedMotion();
  const colors = TONES[tone];
  const timeLabel = time
    ? new Date(time).toLocaleString(locale, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
      className={cn(
        "mx-auto w-full rounded-[24px] border shadow-[0_7px_22px_rgba(73,40,55,0.065)] transition-shadow duration-150 motion-reduce:transition-none hover:shadow-[0_11px_28px_rgba(73,40,55,0.095)]",
        colors.card,
        size === "featured"
          ? "max-w-[600px] p-4 sm:p-5"
          : "max-w-[560px] p-4 sm:p-5",
      )}
      style={{ contentVisibility: "auto", containIntrinsicSize: "132px" }}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-sm",
            colors.icon,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold leading-6 text-nexa-ink md:text-lg">
            {title}
          </h3>
          {timeLabel ? (
            <p className="mt-2.5 text-[13px] font-medium text-nexa-ink-4">
              {timeLabel}
            </p>
          ) : null}
          {body ? (
            <p className="mt-3.5 text-[15px] leading-6 text-nexa-ink-2">
              {body}
            </p>
          ) : null}
          {action ? (
            <motion.button
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => executeCardAction(action, { localePath })}
              className={cn(
                "mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-[background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 lg:min-h-10",
                colors.action,
              )}
            >
              {action.label}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </motion.button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
