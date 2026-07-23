"use client";

import React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { SheetHandle } from "@/components/mobile/SheetHandle";
import { useBottomSheet } from "@/components/mobile/useBottomSheet";
import {
  SEARCH_SHEET_HEIGHT,
  type SearchSheetHeight,
} from "@/components/search/SearchAnimations";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Accessible name when no visible title is provided. */
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
  zIndexClassName?: string;
  /** Height preset for search flow sheets. */
  height?: SearchSheetHeight;
  /** When false, omit default bottom padding (caller pins CTA). */
  padded?: boolean;
  closeOnEscape?: boolean;
  /** When true (default), sheet is hidden from md breakpoint up — use mobile-only sheets. */
  mobileOnly?: boolean;
};

/**
 * Shared mobile bottom sheet — glass surface, safe-area, 250ms motion, reduced-motion.
 */
export function BottomSheet({
  open,
  onOpenChange,
  children,
  ariaLabel,
  className,
  contentClassName,
  zIndexClassName = "z-[65]",
  height,
  padded = true,
  closeOnEscape = true,
  mobileOnly = true,
}: Props) {
  const { t } = useLanguage();
  const { entered, close } = useBottomSheet({ open, onOpenChange, closeOnEscape });
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0",
        mobileOnly && "md:hidden",
        zIndexClassName,
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? t("common.menu")}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-[250ms] motion-reduce:transition-none",
          entered ? "opacity-100" : "opacity-0",
        )}
        aria-label={t("common.close")}
        onClick={close}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-[24px]",
          "border border-white/40 bg-white/[0.96] backdrop-blur-2xl shadow-nexa-lg",
          "pt-3 px-4",
          padded && "pb-[max(1rem,env(safe-area-inset-bottom))]",
          "transition-transform duration-[250ms] ease-out motion-reduce:transition-none",
          height ? SEARCH_SHEET_HEIGHT[height] : "max-h-[88dvh] overflow-y-auto",
          entered ? "translate-y-0" : "translate-y-full",
          contentClassName,
        )}
      >
        <SheetHandle />
        {children}
      </div>
    </div>,
    document.body,
  );
}
