"use client";

import { useEffect, useState } from "react";

/**
 * Delay showing a loading UI (~180ms) so fast responses skip skeleton flash.
 */
export function useDelayedLoading(isLoading: boolean, delayMs = 180): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShow(false);
      return;
    }
    const id = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(id);
  }, [isLoading, delayMs]);

  return show;
}
