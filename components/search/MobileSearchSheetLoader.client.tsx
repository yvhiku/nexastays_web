"use client";

import { useEffect, useState } from "react";
import { useMobileSearch } from "./MobileSearchProvider";
import { OverlayPortal } from "@/components/ui/OverlayPortal";

export function MobileSearchSheetLoader() {
  const { open } = useMobileSearch();
  const [Sheet, setSheet] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || Sheet) return;
    setLoading(true);
    void import("./MobileSearchSheet")
      .then((m) => setSheet(() => m.MobileSearchSheet))
      .finally(() => setLoading(false));
  }, [open, Sheet]);

  if (!open && !Sheet) return null;
  if (loading && !Sheet) {
    return (
      <OverlayPortal layer="drawer">
      <div
        className="fixed inset-0 z-layer-drawer flex items-end justify-center bg-black/20 md:hidden"
        aria-busy="true"
        aria-label="Loading search"
      >
        <div className="mb-24 h-10 w-10 animate-spin rounded-full border-2 border-nexa-primary border-t-transparent" />
      </div>
      </OverlayPortal>
    );
  }
  if (!Sheet) return null;
  return <Sheet />;
}
