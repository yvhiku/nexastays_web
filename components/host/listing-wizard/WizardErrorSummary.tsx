"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { WizardFieldErrors, WizardMessage } from "@/lib/host-listing-wizard/form-types";
import { WizardStatusIcon } from "./wizard-status";

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export function resolveMessage(tf: Translate, message: WizardMessage): string {
  return tf(message.key, message.vars);
}

/**
 * Scroll + focus a field by its wizard id. Uses `block: "center"` so the
 * sticky footer never covers the focused control.
 */
export function focusWizardField(fieldId: string): boolean {
  if (typeof document === "undefined") return false;
  const wrapper = document.querySelector<HTMLElement>(`[data-wizard-field="${fieldId}"]`);
  if (!wrapper) return false;
  const control = wrapper.querySelector<HTMLElement>(
    "input, textarea, select, button, [tabindex]:not([tabindex='-1'])",
  );
  const target = control ?? wrapper;
  target.scrollIntoView({ block: "center", behavior: "smooth" });
  target.focus({ preventScroll: true });
  return true;
}

/**
 * Focusable validation summary (WCAG: complements inline errors, links each
 * item to its field, receives focus after a failed Continue).
 */
export const WizardErrorSummary = React.forwardRef<
  HTMLDivElement,
  {
    errors: WizardFieldErrors;
    fieldLabels?: Record<string, string>;
    className?: string;
  }
>(function WizardErrorSummary({ errors, fieldLabels, className }, ref) {
  const { t, tf } = useLanguage();
  const titleId = React.useId();
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      aria-labelledby={titleId}
      className={cn(
        "rounded-2xl border-2 border-red-500 bg-red-50 p-4 outline-none focus-visible:ring-2 focus-visible:ring-red-500/30",
        className,
      )}
    >
      <p
        id={titleId}
        className="flex items-center gap-2 font-sans text-sm font-semibold text-red-700"
      >
        <WizardStatusIcon status="error" size={16} />
        {tf("hostListing.wizard.validation.summaryTitle", { count: entries.length })}
      </p>
      <ul className="mt-2 space-y-1">
        {entries.map(([fieldId, message]) => (
          <li key={fieldId}>
            <button
              type="button"
              onClick={() => focusWizardField(fieldId)}
              className="min-h-[32px] text-start text-sm text-red-700 underline decoration-red-300 underline-offset-2 hover:decoration-red-700"
            >
              {fieldLabels?.[fieldId] ? `${fieldLabels[fieldId]}: ` : ""}
              {resolveMessage(tf, message)}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-red-700/80">{t("hostListing.wizard.validation.summaryHint")}</p>
    </div>
  );
});
