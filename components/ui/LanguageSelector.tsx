"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { LOCALES, type Locale } from "@/lib/i18n";
import { AnchoredOverlayPortal } from "@/components/ui/OverlayPortal";

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const current = LOCALES.find((l) => l.code === locale);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-nexa-ink-3 hover:text-nexa-primary hover:bg-nexa-primary-soft transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{current?.native ?? current?.code}</span>
      </button>
      {open && (
        <AnchoredOverlayPortal
          anchor={ref}
          layer="dropdown"
          align="end"
          minWidth={140}
          maxWidth={220}
          className="py-1 bg-white rounded-lg shadow-lg border border-nexa-line"
        >
          <div ref={panelRef} role="menu">
            {LOCALES.map(({ code, name, native }) => (
              <button
                key={code}
                role="menuitem"
                onClick={() => {
                  setLocale(code as Locale);
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-start text-sm transition-colors",
                  locale === code
                    ? "text-nexa-primary font-medium bg-nexa-primary-soft"
                    : "text-nexa-ink hover:bg-nexa-bg-2"
                )}
              >
                <span className="font-medium">{native}</span>
                {native !== name && (
                  <span className="ms-1.5 text-nexa-ink-4 text-xs">({name})</span>
                )}
              </button>
            ))}
          </div>
        </AnchoredOverlayPortal>
      )}
    </div>
  );
}
