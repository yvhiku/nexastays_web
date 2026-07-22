"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ExploreRailDescriptor } from "./types";

type Props = {
  descriptor: ExploreRailDescriptor;
  scrollDepth: number;
  children: React.ReactNode;
  className?: string;
};

export function ExploreFeedRail({
  descriptor,
  scrollDepth,
  children,
  className,
}: Props) {
  const innerHeight =
    typeof window !== "undefined" ? window.innerHeight : 800;
  const eligible =
    descriptor.scrollGate == null ||
    scrollDepth >= descriptor.scrollGate * innerHeight;

  const [visible, setVisible] = useState(!descriptor.animateOnEnter);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!descriptor.animateOnEnter || !eligible) return;
    setVisible(false);
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [descriptor.animateOnEnter, eligible, descriptor.id]);

  if (!eligible) return null;

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animate = descriptor.animateOnEnter && !reduceMotion;

  return (
    <div
      ref={ref}
      className={cn(
        className,
        animate &&
          "transition-[opacity,transform] duration-[250ms] ease-out motion-reduce:transition-none",
        animate && (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"),
      )}
    >
      {children}
    </div>
  );
}
