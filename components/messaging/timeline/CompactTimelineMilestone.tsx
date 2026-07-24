"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { executeCardAction, type CardAction } from "@/lib/messaging/actions/registry";

type Props = {
  icon: LucideIcon;
  title: string;
  body?: string | null;
  time?: string | null;
  action?: CardAction;
  localePath: (path: string) => string;
};

export function CompactTimelineMilestone({
  icon: Icon,
  title,
  body,
  time,
  action,
  localePath,
}: Props) {
  const timeLabel = time
    ? new Date(time).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className="mx-auto flex w-full max-w-xl items-center gap-2 py-0.5"
      style={{ contentVisibility: "auto", containIntrinsicSize: "40px" }}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-nexa-primary/25" aria-hidden />
      <div className="flex max-w-[74%] items-center gap-1.5 text-center">
        <Icon className="h-3.5 w-3.5 shrink-0 text-nexa-primary drop-shadow-[0_2px_4px_rgba(232,80,122,0.18)]" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-nexa-ink-2">{title}</p>
          {body || timeLabel ? (
            <p className="line-clamp-1 text-[10px] text-nexa-ink-4">
              {[body, timeLabel].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {action ? (
            <button
              type="button"
              onClick={() => executeCardAction(action, { localePath })}
              className="rounded-full bg-nexa-primary-soft px-2 py-0.5 text-[11px] font-semibold text-nexa-primary shadow-[0_2px_7px_rgba(232,80,122,0.08)] transition-[background-color,transform] hover:bg-[#fbe3e9] active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      </div>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-nexa-primary/25" aria-hidden />
    </div>
  );
}
