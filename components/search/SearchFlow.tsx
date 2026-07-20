"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { SheetHeader } from "@/components/mobile/SheetHeader";
import { SearchSummary } from "./SearchSummary";
import { DestinationSheet } from "./DestinationSheet";
import { DateSheet } from "./DateSheet";
import { GuestSheet } from "./GuestSheet";
import { SEARCH_MOTION, nexaHaptic } from "./SearchAnimations";
import type { SearchActiveStep } from "./SearchState";
import {
  DEFAULT_SEARCH_BAR_VALUE,
  type SearchBarValue,
} from "./types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onSearch: (value: SearchBarValue) => void;
  t: (key: string) => string;
  tf: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
};

/** Session-scoped draft so accidental dismiss doesn't wipe progress. */
let sessionDraft: SearchBarValue = { ...DEFAULT_SEARCH_BAR_VALUE };

export function SearchFlow({
  open,
  onClose,
  onSearch,
  t,
  tf,
  locale,
}: Props) {
  const [value, setValue] = useState<SearchBarValue>(sessionDraft);
  const [activeStep, setActiveStep] = useState<SearchActiveStep>(null);
  const [flashStep, setFlashStep] = useState<SearchActiveStep>(null);
  const [lastFocused, setLastFocused] = useState<Exclude<SearchActiveStep, null> | null>(
    null,
  );
  const [enteredRoot, setEnteredRoot] = useState(false);

  const whereRef = useRef<HTMLButtonElement>(null);
  const whenRef = useRef<HTMLButtonElement>(null);
  const guestsRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      setActiveStep(null);
      setEnteredRoot(false);
      return;
    }
    setValue(sessionDraft);
    const id = requestAnimationFrame(() => setEnteredRoot(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  const patch = useCallback((partial: Partial<SearchBarValue>) => {
    setValue((prev) => {
      const next = { ...prev, ...partial };
      sessionDraft = next;
      return next;
    });
  }, []);

  const flash = useCallback((step: Exclude<SearchActiveStep, null>) => {
    setFlashStep(step);
    window.setTimeout(() => setFlashStep(null), SEARCH_MOTION.flashMs);
  }, []);

  const closeStep = useCallback(() => {
    setActiveStep(null);
  }, []);

  const openStep = useCallback((step: Exclude<SearchActiveStep, null>) => {
    setLastFocused(step);
    setActiveStep(step);
  }, []);

  const onDestinationSelected = useCallback(() => {
    flash("destination");
    setLastFocused("dates");
    setActiveStep("dates");
  }, [flash]);

  const onDatesComplete = useCallback(() => {
    flash("dates");
    setLastFocused("guests");
    setActiveStep("guests");
  }, [flash]);

  const onGuestsDone = useCallback(() => {
    flash("guests");
    setLastFocused("guests");
    setActiveStep(null);
  }, [flash]);

  const handleSearchStays = useCallback(() => {
    nexaHaptic(16);
    const snapshot = value;
    sessionDraft = { ...DEFAULT_SEARCH_BAR_VALUE };
    setValue(sessionDraft);
    setActiveStep(null);
    onSearch(snapshot);
  }, [onSearch, value]);

  return (
    <>
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        height="summary"
        padded={false}
        zIndexClassName="z-[65]"
        ariaLabel={t("pwa.navSearch")}
        closeOnEscape={activeStep === null}
        contentClassName={cn(
          "transition-[transform,opacity] duration-[220ms] ease-out",
          enteredRoot ? "scale-100 opacity-100" : "scale-[0.98] opacity-95",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader title={t("pwa.navSearch")} onClose={onClose} />
          <SearchSummary
            value={value}
            locale={locale}
            t={t}
            tf={tf}
            flashStep={flashStep}
            lastFocused={activeStep === null ? lastFocused : null}
            onOpenStep={openStep}
            onSearchStays={handleSearchStays}
            whereRef={whereRef}
            whenRef={whenRef}
            guestsRef={guestsRef}
          />
        </div>
      </BottomSheet>

      <DestinationSheet
        open={open && activeStep === "destination"}
        value={value}
        onPatch={patch}
        onClose={closeStep}
        onSelected={onDestinationSelected}
        t={t}
      />
      <DateSheet
        open={open && activeStep === "dates"}
        value={value}
        locale={locale}
        onPatch={patch}
        onClose={closeStep}
        onComplete={onDatesComplete}
        t={t}
      />
      <GuestSheet
        open={open && activeStep === "guests"}
        value={value}
        onPatch={patch}
        onClose={closeStep}
        onDone={onGuestsDone}
        t={t}
      />
    </>
  );
}
