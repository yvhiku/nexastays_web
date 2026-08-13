"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

type Props = {
  title: string;
  body: string;
  doneLabel: string;
  onDone: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
};

export function ReportConfirmation({
  title,
  body,
  doneLabel,
  onDone,
  secondaryAction,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-nexa-primary-soft text-nexa-primary">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-semibold text-nexa-ink">{title}</h3>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-nexa-ink-3">
            {body}
          </p>
        </div>
        {secondaryAction ? (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="mt-2 text-sm font-semibold text-nexa-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
          >
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
      <div className="shrink-0 border-t border-nexa-line bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
        <button
          type="button"
          onClick={onDone}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-nexa-primary px-4 text-sm font-semibold text-white shadow-messaging-2 transition-[transform,opacity] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
        >
          {doneLabel}
        </button>
      </div>
    </div>
  );
}
