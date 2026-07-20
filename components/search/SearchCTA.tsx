"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchCtaMode } from "./SearchState";

type Props = {
  mode: SearchCtaMode;
  labels: {
    chooseDestination: string;
    chooseDates: string;
    searchStays: string;
  };
  onChooseDestination: () => void;
  onChooseDates: () => void;
  onSearchStays: () => void;
  className?: string;
};

export function SearchCTA({
  mode,
  labels,
  onChooseDestination,
  onChooseDates,
  onSearchStays,
  className,
}: Props) {
  const [pulse, setPulse] = useState(false);
  const pulsedReady = useRef(false);

  useEffect(() => {
    if (mode !== "searchStays" || pulsedReady.current) return;
    pulsedReady.current = true;
    setPulse(true);
    const id = window.setTimeout(() => setPulse(false), 900);
    return () => window.clearTimeout(id);
  }, [mode]);

  const label =
    mode === "chooseDestination"
      ? labels.chooseDestination
      : mode === "chooseDates"
        ? labels.chooseDates
        : labels.searchStays;

  const onClick =
    mode === "chooseDestination"
      ? onChooseDestination
      : mode === "chooseDates"
        ? onChooseDates
        : onSearchStays;

  return (
    <div
      className={cn(
        "shrink-0 border-t border-nexa-line/60 bg-white/95 pt-3",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex h-14 w-full items-center justify-center gap-2 rounded-full",
          "bg-nexa-primary text-base font-bold text-white shadow-[0_8px_24px_rgba(174,34,80,0.28)]",
          "active:scale-[0.98] transition-transform duration-200",
          pulse && "scale-[0.98] animate-pulse",
        )}
      >
        {mode === "searchStays" ? <Search className="h-5 w-5" aria-hidden /> : null}
        {label}
      </button>
    </div>
  );
}
