"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DAY_MARKER_SELECTOR = "[data-timeline-day-label]";
const HIDE_DELAY_MS = 850;

function currentDayLabel(container: HTMLElement): string | null {
  const markers = Array.from(
    container.querySelectorAll<HTMLElement>(DAY_MARKER_SELECTOR),
  );
  if (markers.length === 0) return null;

  const threshold = container.getBoundingClientRect().top + 32;
  let active = markers[0];
  for (const marker of markers) {
    if (marker.getBoundingClientRect().top <= threshold) {
      active = marker;
      continue;
    }
    break;
  }
  return active.dataset.timelineDayLabel?.trim() || null;
}

export function useTransientScrollDate({
  conversationId,
  scrollRef,
}: {
  conversationId: string;
  scrollRef: React.RefObject<HTMLElement | null>;
}) {
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);

  const onScrollActivity = useCallback(() => {
    const container = scrollRef.current;
    if (
      !container ||
      container.scrollHeight <= container.clientHeight + 1
    ) {
      return;
    }

    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, HIDE_DELAY_MS);

    if (frameRef.current != null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const current = scrollRef.current;
      if (!current) return;
      setLabel(currentDayLabel(current));
    });
  }, [scrollRef]);

  useEffect(() => {
    setVisible(false);
    setLabel(null);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      hideTimerRef.current = null;
      frameRef.current = null;
    };
  }, [conversationId]);

  return { label, visible: visible && Boolean(label), onScrollActivity };
}
