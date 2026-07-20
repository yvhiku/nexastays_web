"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type MobileSearchContextValue = {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

const MobileSearchContext = createContext<MobileSearchContextValue | null>(null);

export function MobileSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ open, openSearch, closeSearch }),
    [open, openSearch, closeSearch],
  );
  return (
    <MobileSearchContext.Provider value={value}>{children}</MobileSearchContext.Provider>
  );
}

export function useMobileSearch(): MobileSearchContextValue {
  const ctx = useContext(MobileSearchContext);
  if (!ctx) {
    return {
      open: false,
      openSearch: () => undefined,
      closeSearch: () => undefined,
    };
  }
  return ctx;
}
