"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  isCollectionMilestoneSeen,
  isSavedOnboardingSeen,
  markCollectionMilestoneSeen,
  saveListingId,
  type SavedListingEventDetail,
} from "@/lib/saved-listings";
import { SavedToast, type SavedToastState } from "@/components/saved/SavedToast";

/** Toasts only — first-save celebration is owned by ProductGuidanceProvider. */
export function SavedExperienceHost() {
  const { userId } = useAuth();
  const [toast, setToast] = useState<SavedToastState | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = null;
    };

    const showToast = (next: SavedToastState, ms: number) => {
      clearTimer();
      setToast(next);
      toastTimer.current = window.setTimeout(() => setToast(null), ms);
    };

    const onSaved = (e: Event) => {
      const detail = (e as CustomEvent<SavedListingEventDetail>).detail;
      if (!detail || detail.silent) return;

      if (detail.action === "unsaved") {
        const snapshot = detail.snapshot;
        showToast(
          {
            kind: "removed",
            listingId: detail.listingId,
            onUndo: () => {
              if (userId) saveListingId(detail.listingId, userId, snapshot);
            },
          },
          4000,
        );
        return;
      }

      // First save: guidance celebration handles UX
      if (detail.isFirstSaveEver || !isSavedOnboardingSeen()) return;

      if (detail.count >= 3 && !isCollectionMilestoneSeen()) {
        markCollectionMilestoneSeen();
        showToast({ kind: "collection" }, 2500);
        return;
      }

      showToast({ kind: "saved" }, 2000);
    };

    const onStorage = (event: StorageEvent) => {
      if (!userId || event.key !== `nexa-saved-listings:${userId}`) return;
      let count = 0;
      try {
        const parsed = JSON.parse(event.newValue ?? "[]");
        count = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        count = 0;
      }
      window.dispatchEvent(
        new CustomEvent<SavedListingEventDetail>(
          "nexa-saved-listings-changed",
          {
            detail: {
              action: "saved",
              listingId: "",
              count,
              isFirstSaveEver: false,
              silent: true,
            },
          },
        ),
      );
    };

    window.addEventListener("nexa-saved-listings-changed", onSaved);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("nexa-saved-listings-changed", onSaved);
      window.removeEventListener("storage", onStorage);
      clearTimer();
    };
  }, [userId]);

  return <SavedToast toast={toast} onDismiss={() => setToast(null)} />;
}
