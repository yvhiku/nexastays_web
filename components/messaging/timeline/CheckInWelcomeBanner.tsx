"use client";

import React, { useEffect, useState } from "react";
import { House, X } from "lucide-react";
import {
  dateOnlyInTimeZone,
  propertyTimeZone,
} from "@/lib/messaging/context-panel";

type Props = {
  conversationId: string;
  checkInDate: string;
  country?: string | null;
  visible: boolean;
  title: string;
  body: string;
  dismissLabel: string;
};

export function CheckInWelcomeBanner({
  conversationId,
  checkInDate,
  country,
  visible,
  title,
  body,
  dismissLabel,
}: Props) {
  const storageKey = `nexa-checkin-welcome:${conversationId}`;
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  const today = dateOnlyInTimeZone(new Date(), propertyTimeZone(country));
  if (!visible || dismissed || checkInDate.slice(0, 10) !== today) return null;

  return (
    <aside className="flex shrink-0 items-center gap-3 border-b border-nexa-primary/10 bg-nexa-primary-soft/85 px-4 py-2.5 text-nexa-ink-2 backdrop-blur" role="status">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-nexa-primary shadow-sm">
        <House className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-nexa-ink-3">{body}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(storageKey, "1");
          setDismissed(true);
        }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-nexa-ink-3 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
        aria-label={dismissLabel}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </aside>
  );
}
