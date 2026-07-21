"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationPresentation } from "@/lib/messaging/messages-api";
import { executeCardAction } from "@/lib/messaging/actions/registry";

type Props = {
  presentation: ConversationPresentation;
  collapsedExternal?: boolean;
  localePath: (path: string) => string;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
};

export function ReservationContextBar({
  presentation,
  collapsedExternal = false,
  localePath,
  scrollContainerRef,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 48);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollContainerRef]);

  const collapsed = collapsedExternal || (!expanded && scrolled);
  const bookingId = presentation.reservation.bookingId;

  return (
    <div
      className={cn(
        "border-b border-nexa-line/60 bg-white/95 backdrop-blur-md transition-all duration-200",
        collapsed ? "shadow-sm" : "",
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 min-h-[48px]">
        <p className="flex-1 min-w-0 text-xs text-nexa-ink-3 truncate">
          {presentation.bookingChip}
        </p>
        {bookingId ? (
          <button
            type="button"
            onClick={() =>
              executeCardAction(
                {
                  id: "view_booking",
                  label: "View booking",
                  type: "deep_link",
                  url: `/bookings/${bookingId}`,
                },
                { localePath },
              )
            }
            className="shrink-0 text-xs font-semibold text-nexa-primary hover:underline"
          >
            View booking
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 p-1 text-nexa-ink-4"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded ? (
        <div className="px-4 pb-3 text-xs text-nexa-ink-3 space-y-1">
          {presentation.reservation.addressDisplay ? (
            <p>{presentation.reservation.addressDisplay}</p>
          ) : null}
          {presentation.reservation.bookingReference ? (
            <p className="font-mono text-[11px]">{presentation.reservation.bookingReference}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
