"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import type { WizardStepDef } from "@/lib/host-listing-wizard/form-types";
import type { SaveState, WizardStepStatus } from "@/lib/host-listing-wizard/step-status";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  WizardStatusBadge,
  WizardStatusIcon,
  wizardStatusClasses,
} from "./wizard-status";
import { WIZARD_STICKY_TOP } from "./wizard-chrome";

/** Space reserved so focused fields / the error summary stay above the sticky footer. */
export const WIZARD_FOOTER_CLEARANCE = "7.5rem";
const CONTENT_BOTTOM_PAD = `calc(${WIZARD_FOOTER_CLEARANCE} + env(safe-area-inset-bottom, 0px))`;

export function ListingWizardShell({
  steps,
  statuses,
  stepIndex,
  completionPercentage,
  saveState,
  onRetrySave,
  canContinue,
  continuing,
  busyLabel,
  mobileOpen,
  onMobileOpenChange,
  onBack,
  onContinue,
  onSaveDraft,
  onJump,
  children,
}: {
  steps: WizardStepDef[];
  statuses: WizardStepStatus[];
  stepIndex: number;
  /** Weighted Listing Complete % from flags (primary progress). */
  completionPercentage?: number;
  saveState: SaveState;
  onRetrySave: () => void;
  canContinue: boolean;
  continuing?: boolean;
  /** Progress label shown next to the primary button while `continuing`. */
  busyLabel?: string | null;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft: () => void;
  onJump: (index: number) => void;
  children: React.ReactNode;
}) {
  const { t, tf, localePath } = useLanguage();
  const total = Math.max(steps.length, 1);
  const current = steps[stepIndex];
  const isLast = stepIndex === total - 1;
  const completePct =
    completionPercentage != null
      ? Math.min(100, Math.max(0, completionPercentage))
      : ((stepIndex + 1) / total) * 100;
  const stepOfLabel = tf("hostListing.wizard.shell.stepOf", {
    step: stepIndex + 1,
    total,
  });
  const continueLabel = isLast
    ? t("hostListing.wizard.shell.submit")
    : t("hostListing.wizard.shell.continue");

  // Focus + scroll management on step change: land on the step heading so
  // keyboard and screen-reader users are oriented without hunting.
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const firstRender = React.useRef(true);
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    const heading = contentRef.current?.querySelector<HTMLElement>("h2[tabindex='-1']");
    heading?.focus({ preventScroll: true });
  }, [stepIndex]);

  const progressBar = (tone: "light" | "dark") => (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(completePct)}
      aria-label={t("hostListing.wizard.shell.progress")}
      className={cn(
        "h-1 overflow-hidden rounded-sm",
        tone === "dark" ? "bg-white/15" : "bg-nexa-line",
      )}
    >
      {/* Block child starts at inline-start, so the fill grows in reading direction under dir="rtl". */}
      <div
        className="h-full rounded-sm bg-gradient-to-r from-nexa-primary to-nexa-primary-light transition-[width] duration-200 motion-reduce:transition-none"
        style={{ width: `${completePct}%` }}
      />
    </div>
  );

  const stepList = (
    <nav aria-label={t("hostListing.wizard.shell.stepsNav")} className="flex flex-col gap-1">
      {steps.map((s, i) => {
        const status = statuses[i] ?? "needsAttention";
        const label = t(s.labelKey);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(i)}
            aria-current={i === stepIndex ? "step" : undefined}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-start transition-colors duration-150",
              i === stepIndex ? "bg-nexa-primary/20" : "hover:bg-white/5",
            )}
          >
            <WizardStatusBadge status={status} index={i + 1} tone="dark" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span
                className={cn(
                  "truncate font-sans text-sm",
                  i === stepIndex ? "font-semibold text-white" : "text-white/70",
                )}
              >
                {label}
              </span>
              {s.optional && (
                <span className="text-[0.7rem] text-white/45">
                  {t("hostListing.wizard.shell.optional")}
                </span>
              )}
            </span>
            {status === "needsAttention" && i !== stepIndex && (
              <WizardStatusIcon
                status="needsAttention"
                className={wizardStatusClasses("needsAttention", "dark").text}
                label={t("hostListing.wizard.shell.stepIncomplete")}
              />
            )}
          </button>
        );
      })}
    </nav>
  );

  const sidebar = (
    <>
      <Link
        href={localePath("/")}
        className="mb-8 flex items-center gap-2.5 hover:opacity-90"
      >
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={NEXA_STAYS_LOGO_SRC}
            alt="Nexa Stays"
            fill
            sizes="36px"
            className="object-cover"
          />
        </div>
        <span className="font-sans text-lg font-semibold text-white">
          {t("hostListing.wizardTitle")}
        </span>
      </Link>
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/40">
          <span>{t("hostListing.wizard.shell.progress")}</span>
          <span className="tabular-nums text-white/70">{Math.round(completePct)}%</span>
        </div>
        {progressBar("dark")}
        <p className="mt-3 text-sm text-white/70">
          {stepOfLabel}
          {current ? ` — ${t(current.descriptionKey)}` : ""}
        </p>
      </div>
      {stepList}
    </>
  );

  return (
    <main
      className="grid min-h-screen grid-cols-1 lg:grid-cols-[320px_1fr]"
      style={{
        paddingTop: WIZARD_STICKY_TOP,
        scrollPaddingBottom: `calc(${WIZARD_FOOTER_CLEARANCE} + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <aside
        className="sticky hidden overflow-y-auto bg-gradient-to-br from-nexa-ink to-nexa-ink-2 p-8 lg:block"
        style={{ top: WIZARD_STICKY_TOP, height: `calc(100vh - ${WIZARD_STICKY_TOP})` }}
      >
        {sidebar}
      </aside>

      <div className="relative flex flex-col bg-gradient-to-b from-nexa-bg via-nexa-bg to-nexa-bg-2">
        {/* Mobile: compact sticky step bar (replaces the old floating FAB that overlapped the footer). */}
        <button
          type="button"
          onClick={() => onMobileOpenChange(true)}
          aria-expanded={mobileOpen}
          aria-controls="listing-wizard-steps-drawer"
          className="sticky z-layer-sticky flex w-full flex-col gap-2 border-b border-nexa-line/80 bg-white/95 px-4 py-3 text-start backdrop-blur-md lg:hidden"
          style={{ top: WIZARD_STICKY_TOP }}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-nexa-ink-4">
                {stepOfLabel}
              </span>
              <span className="truncate text-sm font-semibold text-nexa-ink">
                {current ? t(current.labelKey) : ""}
              </span>
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-nexa-primary">
              {Math.round(completePct)}%
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </span>
          </span>
          {progressBar("light")}
        </button>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,_rgba(232,80,122,0.08),_transparent_60%)]" />
        <div
          ref={contentRef}
          className="relative flex-1 px-4 py-8 sm:px-8 lg:px-16"
          style={{ paddingBottom: CONTENT_BOTTOM_PAD }}
        >
          <div className="mx-auto max-w-[720px]">{children}</div>
        </div>

        {/* Sticky footer: DOM order Back → actions; flex follows `dir`, so under RTL Back and Continue swap visual sides. */}
        <div
          className="sticky bottom-0 z-layer-sticky border-t border-nexa-line/80 bg-white/90 px-4 py-3 shadow-[0_-8px_30px_rgba(26,17,24,0.06)] backdrop-blur-md sm:px-8"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto flex max-w-[720px] flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={onBack}
                disabled={stepIndex === 0 || continuing}
              >
                {t("hostListing.wizard.shell.back")}
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onSaveDraft} disabled={continuing}>
                  {t("hostListing.wizard.shell.saveDraft")}
                </Button>
                <Button
                  onClick={onContinue}
                  disabled={continuing}
                  aria-busy={continuing || undefined}
                  data-step-valid={canContinue}
                >
                  {continuing && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  {continuing && busyLabel ? busyLabel : continueLabel}
                </Button>
              </div>
            </div>
            <SaveStatusLine state={saveState} onRetry={onRetrySave} />
          </div>
        </div>
      </div>

      <OverlayPortal layer="drawer">
        <div
          id="listing-wizard-steps-drawer"
          className={cn(
            "fixed inset-0 z-layer-drawer transition-opacity duration-200 motion-reduce:transition-none lg:hidden",
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={!mobileOpen}
        >
          <div
            className="absolute inset-0 bg-nexa-ink/60"
            onClick={() => onMobileOpenChange(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("hostListing.wizard.shell.stepsNav")}
            className={cn(
              "absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-gradient-to-br from-nexa-ink to-nexa-ink-2 p-6 transition-transform duration-200 motion-reduce:transition-none",
              mobileOpen ? "translate-y-0" : "translate-y-full",
            )}
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
          >
            {sidebar}
          </div>
        </div>
      </OverlayPortal>
    </main>
  );
}

/**
 * Footer save indicator — visible on every breakpoint (the old sidebar-only
 * label was invisible on mobile). Polite live region; errors offer a retry.
 */
function SaveStatusLine({
  state,
  onRetry,
}: {
  state: SaveState;
  onRetry: () => void;
}) {
  const { t, tf } = useLanguage();
  let text: string | null = null;
  if (state.status === "busy") text = t("hostListing.wizard.save.saving");
  else if (state.status === "ok") {
    const time = state.at
      ? state.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
    text = time
      ? tf("hostListing.wizard.save.savedAt", { time })
      : t("hostListing.wizard.save.saved");
  } else if (state.status === "error") text = t("hostListing.wizard.save.failed");

  const status =
    state.status === "busy"
      ? "busy"
      : state.status === "ok"
        ? "ok"
        : state.status === "error"
          ? "error"
          : null;

  return (
    <div
      className="flex min-h-[1.25rem] items-center justify-end gap-2 text-xs"
      aria-live="polite"
      aria-atomic="true"
    >
      {status && text && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            wizardStatusClasses(status).text,
          )}
        >
          <WizardStatusIcon status={status} size={14} />
          <span>{text}</span>
        </span>
      )}
      {state.status === "error" && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] rounded-md px-2 text-xs font-semibold text-nexa-primary underline-offset-2 hover:underline sm:min-h-0"
        >
          {t("hostListing.wizard.save.retry")}
        </button>
      )}
    </div>
  );
}
