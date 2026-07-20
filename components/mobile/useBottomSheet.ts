"use client";

import { useCallback, useEffect, useState } from "react";

export type UseBottomSheetOptions = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Close on Escape (default true). */
  closeOnEscape?: boolean;
};

export function useBottomSheet({
  open,
  onOpenChange,
  closeOnEscape = true,
}: UseBottomSheetOptions) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape, onOpenChange]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  return { entered, close };
}
