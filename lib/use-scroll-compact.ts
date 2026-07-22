"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const EXPLORE_STICKY_SEARCH_EXPAND_DELAY_MS = 150;
export const EXPLORE_STICKY_SEARCH_COMPACT_THRESHOLD = 80;

export function shouldCompactStickySearch(
  scrollY: number,
  threshold = EXPLORE_STICKY_SEARCH_COMPACT_THRESHOLD,
): boolean {
  return scrollY > threshold;
}

type ScrollCompactControllerOptions = {
  threshold?: number;
  expandDelayMs?: number;
  onChange: (compact: boolean) => void;
};

/** Imperative scroll→compact scheduler (testable without React). */
export function createScrollCompactController({
  threshold = EXPLORE_STICKY_SEARCH_COMPACT_THRESHOLD,
  expandDelayMs = EXPLORE_STICKY_SEARCH_EXPAND_DELAY_MS,
  onChange,
}: ScrollCompactControllerOptions) {
  let compact = false;
  let expandTimer: ReturnType<typeof setTimeout> | null = null;

  const setCompact = (next: boolean) => {
    if (next === compact) return;
    compact = next;
    onChange(next);
  };

  const updateCompact = (next: boolean) => {
    if (expandTimer != null) {
      clearTimeout(expandTimer);
      expandTimer = null;
    }
    if (next) {
      setCompact(true);
      return;
    }
    expandTimer = setTimeout(() => {
      setCompact(false);
      expandTimer = null;
    }, expandDelayMs);
  };

  return {
    getCompact: () => compact,
    onScroll: (scrollY: number) => {
      updateCompact(shouldCompactStickySearch(scrollY, threshold));
    },
    destroy: () => {
      if (expandTimer != null) clearTimeout(expandTimer);
    },
  };
}

type UseScrollCompactOptions = {
  threshold?: number;
  expandDelayMs?: number;
};

/** Shrinks immediately on scroll down; expands after a debounced delay at top. */
export function useScrollCompact(options: UseScrollCompactOptions = {}) {
  const { threshold, expandDelayMs } = options;
  const [compact, setCompact] = useState(false);
  const controllerRef = useRef<ReturnType<typeof createScrollCompactController> | null>(
    null,
  );

  const onChange = useCallback((next: boolean) => setCompact(next), []);

  useEffect(() => {
    const controller = createScrollCompactController({
      threshold,
      expandDelayMs,
      onChange,
    });
    controllerRef.current = controller;

    const onScroll = () => controller.onScroll(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      controller.destroy();
      controllerRef.current = null;
    };
  }, [threshold, expandDelayMs, onChange]);

  return compact;
}
