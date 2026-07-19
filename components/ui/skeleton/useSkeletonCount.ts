"use client";

import { useEffect, useState } from "react";

/** Viewport-aware skeleton count: mobile ~6, tablet ~9, desktop ~15. */
export function useSkeletonCount(
  defaults: { mobile?: number; tablet?: number; desktop?: number } = {},
): number {
  const mobile = defaults.mobile ?? 6;
  const tablet = defaults.tablet ?? 9;
  const desktop = defaults.desktop ?? 15;

  const [count, setCount] = useState(mobile);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCount(desktop);
      else if (w >= 640) setCount(tablet);
      else setCount(mobile);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [mobile, tablet, desktop]);

  return count;
}
