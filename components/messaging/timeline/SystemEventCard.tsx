"use client";

import React from "react";
import { BadgeCheck } from "lucide-react";
import type { CardProps } from "./registry";

export function SystemEventCard({ message }: CardProps) {
  const time = message.sentAt ?? message.createdAt;
  return (
    <div className="mx-auto w-full max-w-[92%] rounded-2xl border border-nexa-line/60 bg-nexa-bg-2/80 px-4 py-3 text-center shadow-nexa-sm">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-nexa-primary-soft text-nexa-primary">
        <BadgeCheck className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-nexa-ink">{message.body ?? "Update"}</p>
      {time ? (
        <p className="mt-2 text-[10px] text-nexa-ink-4 tabular-nums">
          {new Date(time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </p>
      ) : null}
    </div>
  );
}
