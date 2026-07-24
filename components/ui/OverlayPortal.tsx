"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { LAYER_CLASS, type LayerName } from "@/lib/ui/layers";

type OverlayPortalProps = {
  children: React.ReactNode;
  layer?: LayerName;
  className?: string;
};

export function OverlayPortal({
  children,
  layer = "popover",
  className,
}: OverlayPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className={cn(LAYER_CLASS[layer], className)}>{children}</div>,
    document.body,
  );
}

type Alignment = "start" | "center" | "end";

type AnchoredOverlayPortalProps = OverlayPortalProps & {
  anchor: React.RefObject<HTMLElement>;
  align?: Alignment;
  gap?: number;
  matchAnchorWidth?: boolean;
  minWidth?: number;
  maxWidth?: number;
  side?: "top" | "bottom";
};

type Position = {
  left: number;
  top?: number;
  bottom?: number;
  width?: number;
};

export function AnchoredOverlayPortal({
  anchor,
  children,
  layer = "popover",
  className,
  align = "start",
  gap = 8,
  matchAnchorWidth = false,
  minWidth,
  maxWidth,
  side = "bottom",
}: AnchoredOverlayPortalProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);

  const updatePosition = useCallback(() => {
    const element = anchor.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const viewportPadding = 12;
    const desiredWidth = matchAnchorWidth
      ? rect.width
      : Math.min(maxWidth ?? rect.width, window.innerWidth - viewportPadding * 2);
    const width = Math.max(minWidth ?? 0, desiredWidth);
    let left =
      align === "center"
        ? rect.left + rect.width / 2 - width / 2
        : align === "end"
          ? rect.right - width
          : rect.left;

    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - width - viewportPadding),
    );

    setPosition({
      left,
      ...(side === "top"
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
      width,
    });
  }, [align, anchor, gap, matchAnchorWidth, maxWidth, minWidth, side]);

  useEffect(() => setMounted(true), []);
  useLayoutEffect(() => {
    if (!mounted) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, updatePosition]);

  if (!mounted || !position) return null;

  return createPortal(
    <div
      className={cn("fixed", LAYER_CLASS[layer], className)}
      style={position}
    >
      {children}
    </div>,
    document.body,
  );
}
