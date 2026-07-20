"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  onBackdropClick?: () => void;
  labelledBy?: string;
  blur?: boolean;
};

/** Dim overlay with optional blur + focus trap. */
export function GuidanceOverlay({
  children,
  className,
  onBackdropClick,
  labelledBy,
  blur = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    prevFocus.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const root = rootRef.current;
    const focusable = root?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBackdropClick?.();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      prevFocus.current?.focus?.();
    };
  }, [onBackdropClick]);

  return (
    <div
      ref={rootRef}
      className={cn("fixed inset-0 z-[120] flex", className)}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <button
        type="button"
        aria-label="Close"
        className={cn(
          "absolute inset-0 bg-[rgba(26,17,24,0.55)]",
          blur && "backdrop-blur-[8px]",
        )}
        onClick={onBackdropClick}
      />
      <div className="relative z-10 flex w-full flex-col" aria-live="polite">
        {children}
      </div>
    </div>
  );
}
