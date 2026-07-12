"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import type { WizardStepDef } from "@/lib/host-listing-wizard/form-types";

export function ListingWizardShell({
  brandTitle,
  steps,
  stepIndex,
  savedLabel,
  canContinue,
  continuing,
  mobileOpen,
  onMobileOpenChange,
  onBack,
  onContinue,
  onSaveDraft,
  onJump,
  labels,
  children,
}: {
  brandTitle: string;
  steps: WizardStepDef[];
  stepIndex: number;
  savedLabel: string | null;
  canContinue: boolean;
  continuing?: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft: () => void;
  onJump: (index: number) => void;
  labels?: {
    back?: string;
    saveDraft?: string;
    continue?: string;
    submit?: string;
    progress?: string;
    stepOf?: string;
  };
  children: React.ReactNode;
}) {
  const total = Math.max(steps.length, 1);
  const current = steps[stepIndex];
  const progress = ((stepIndex + 1) / total) * 100;
  const backLabel = labels?.back ?? "Back";
  const saveLabel = labels?.saveDraft ?? "Save draft";
  const continueLabel =
    stepIndex === total - 1
      ? labels?.submit ?? "Submit for review"
      : labels?.continue ?? "Continue";
  const progressTitle = labels?.progress ?? "Progress";
  const stepOfLabel = (labels?.stepOf ?? "Step {step} of {total}")
    .replace("{step}", String(stepIndex + 1))
    .replace("{total}", String(total));

  const sidebar = (
    <>
      <Link
        href="/"
        className="mb-8 flex items-center gap-2.5 hover:opacity-90"
      >
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
          <Image src={NEXA_STAYS_LOGO_SRC} alt="Nexa Stays" fill sizes="36px" className="object-cover" />
        </div>
        <span className="font-sans text-lg font-semibold text-white">{brandTitle}</span>
      </Link>
      <div className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
          {progressTitle}
        </div>
        <div className="h-1 rounded-sm bg-white/15">
          <div
            className="h-full rounded-sm bg-gradient-to-r from-nexa-primary to-nexa-primary-light transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-white/70">
          {stepOfLabel}
          {current ? ` — ${current.description}` : ""}
        </p>
      </div>
      <nav className="flex flex-col gap-1">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(i)}
            disabled={i > stepIndex}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
              i === stepIndex ? "bg-nexa-primary/20" : "hover:bg-white/5",
              i > stepIndex && "cursor-not-allowed opacity-40 hover:bg-transparent",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.78rem] font-bold",
                i < stepIndex
                  ? "border-nexa-primary bg-nexa-primary text-white"
                  : i === stepIndex
                    ? "border-nexa-primary bg-nexa-primary/15 text-nexa-primary"
                    : "border-white/20 text-white/40",
              )}
            >
              {i < stepIndex ? "✓" : i + 1}
            </span>
            <span
              className={cn(
                "font-sans text-sm",
                i === stepIndex ? "font-semibold text-white" : "text-white/55",
              )}
            >
              {s.label}
            </span>
          </button>
        ))}
      </nav>
      {savedLabel && (
        <p className="mt-8 text-xs text-white/45">{savedLabel}</p>
      )}
    </>
  );

  return (
    <main className="grid min-h-screen grid-cols-1 pt-[72px] lg:grid-cols-[320px_1fr]">
      <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] overflow-hidden bg-gradient-to-br from-nexa-ink to-nexa-ink-2 p-8 lg:block">
        {sidebar}
      </aside>

      <div className="relative flex min-h-[calc(100vh-72px)] flex-col bg-gradient-to-b from-nexa-bg via-nexa-bg to-nexa-bg-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,_rgba(232,80,122,0.08),_transparent_60%)]" />
        <div className="relative flex-1 px-4 py-8 pb-28 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-[720px]">{children}</div>
        </div>

        <div className="sticky bottom-0 z-30 border-t border-nexa-line/80 bg-white/90 px-4 py-3 shadow-[0_-8px_30px_rgba(26,17,24,0.06)] backdrop-blur-md sm:px-8">
          <div className="mx-auto flex max-w-[720px] flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={onBack} disabled={stepIndex === 0 || continuing}>
              {backLabel}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onSaveDraft} disabled={continuing}>
                {saveLabel}
              </Button>
              <Button onClick={onContinue} disabled={!canContinue || continuing}>
                {continuing ? "…" : continueLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <button
          type="button"
          onClick={() => onMobileOpenChange(true)}
          className="flex min-h-[48px] items-center gap-2 rounded-full bg-nexa-ink px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <Menu className="h-4 w-4" />
          {stepOfLabel}
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="absolute inset-0 bg-nexa-ink/60" onClick={() => onMobileOpenChange(false)} />
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-gradient-to-br from-nexa-ink to-nexa-ink-2 p-6 transition-transform",
            mobileOpen ? "translate-y-0" : "translate-y-full",
          )}
        >
          {sidebar}
        </div>
      </div>
    </main>
  );
}
