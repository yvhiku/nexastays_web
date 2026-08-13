"use client";

import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import { useFocusTrap } from "@/components/messaging/hooks/useFocusTrap";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  onBack?: () => void;
  showClose?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Near-full-height report/safety shell — matches ConversationSearchModal chrome.
 */
export function ReportFlowShell({
  open,
  onClose,
  title,
  onBack,
  showClose = true,
  children,
  footer,
}: Props) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (onBack) onBack();
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onBack, onClose]);

  return (
    <OverlayPortal layer="modal">
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-layer-modal flex items-end justify-center bg-black/35 p-0 backdrop-blur-sm sm:items-center sm:p-5">
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-0"
              onClick={onClose}
              aria-label={t("common.close")}
            />
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={
                reduceMotion ? false : { opacity: 0, y: 16, scale: 0.985 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              className={cn(
                "relative flex h-[92dvh] w-full min-w-0 flex-col overflow-hidden bg-nexa-bg shadow-messaging-4",
                "rounded-t-[24px] sm:h-[88dvh] sm:w-[90vw] sm:max-w-[520px] sm:rounded-messaging-panel sm:border sm:border-nexa-line",
              )}
            >
              <header className="shrink-0 border-b border-nexa-line bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-5">
                <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-nexa-line sm:hidden" aria-hidden />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    {onBack ? (
                      <button
                        type="button"
                        onClick={onBack}
                        className="flex min-h-11 items-center gap-1 rounded-full pe-2 ps-1 text-sm font-semibold text-nexa-ink-3 hover:bg-nexa-bg-2"
                        aria-label={t("common.back")}
                      >
                        <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
                      </button>
                    ) : null}
                    <h2 className="truncate font-display text-lg font-semibold text-nexa-ink sm:text-xl">
                      {title}
                    </h2>
                  </div>
                  {showClose ? (
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-nexa-ink-3 hover:bg-nexa-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
                      aria-label={t("common.close")}
                    >
                      <X className="h-5 w-5" aria-hidden />
                    </button>
                  ) : null}
                </div>
              </header>
              <div className="flex min-h-0 flex-1 flex-col">{children}</div>
              {footer}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}

type StickyCtaProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function ReportStickyCta({
  label,
  onClick,
  disabled,
  loading,
}: StickyCtaProps) {
  return (
    <div className="shrink-0 border-t border-nexa-line bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-nexa-primary px-4 text-sm font-semibold text-white shadow-messaging-2 transition-[transform,opacity] enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none"
              aria-hidden
            />
            {label}
          </span>
        ) : (
          label
        )}
      </button>
    </div>
  );
}
