"use client";

import React from "react";
import { Check } from "lucide-react";
import type { ConversationDetail } from "@/lib/messaging/messages-api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  deriveJourneyIndex,
  supportedJourneySteps,
  type JourneyStepId,
} from "./journey";

export function BookingJourney({
  conversation,
  compact = false,
}: {
  conversation: ConversationDetail;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const steps = supportedJourneySteps(conversation);
  const activeIndex = Math.min(deriveJourneyIndex(conversation), steps.length - 1);

  return (
    <nav
      className={cn(
        "border-t border-nexa-line/60 bg-white/88 px-3",
        compact ? "py-2" : "py-3",
      )}
      aria-label={t("inbox.phase14.journey")}
    >
      <ol className="mx-auto flex w-full max-w-[920px] items-start">
        {steps.map((step, index) => {
          const completed = index < activeIndex;
          const current = index === activeIndex;
          return (
            <li
              key={step}
              className="relative flex min-w-0 flex-1 flex-col items-center"
              aria-current={current ? "step" : undefined}
            >
              {index > 0 ? (
                <span
                  className={cn(
                    "absolute end-1/2 top-2.5 h-px w-full",
                    index <= activeIndex ? "bg-nexa-primary/45" : "bg-nexa-line",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-layer-content flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white",
                  completed || current
                    ? "border-nexa-primary text-nexa-primary"
                    : "border-nexa-line text-transparent",
                  current && "ring-4 ring-nexa-primary/10",
                )}
              >
                {completed ? <Check className="h-3 w-3" aria-hidden /> : null}
              </span>
              <span
                className={cn(
                  "mt-1.5 max-w-full truncate px-1 text-center text-[9px] font-bold sm:text-[10px]",
                  current
                    ? "text-nexa-primary"
                    : completed
                      ? "text-nexa-ink-2"
                      : "text-nexa-ink-4",
                )}
              >
                {t(`inbox.phase14.steps.${step as JourneyStepId}`)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
