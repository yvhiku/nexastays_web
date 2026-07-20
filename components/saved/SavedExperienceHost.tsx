"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  isCollectionMilestoneSeen,
  isSavedOnboardingSeen,
  markCollectionMilestoneSeen,
  saveListingId,
  type SavedListingEventDetail,
  type SavedListingSnapshot,
} from "@/lib/saved-listings";
import { SavedOnboardingSheet } from "@/components/saved/SavedOnboardingSheet";
import { SavedToast, type SavedToastState } from "@/components/saved/SavedToast";

export function SavedExperienceHost() {
  const { userId } = useAuth();
  const [onboarding, setOnboarding] = useState<SavedListingSnapshot | null>(null);
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

      // saved
      if (detail.isFirstSaveEver || (!isSavedOnboardingSeen() && detail.snapshot)) {
        setOnboarding(detail.snapshot ?? { id: detail.listingId, title: "Stay" });
        return;
      }

      if (detail.count >= 3 && !isCollectionMilestoneSeen()) {
        markCollectionMilestoneSeen();
        showToast({ kind: "collection" }, 2500);
        return;
      }

      showToast({ kind: "saved" }, 2000);
    };

    window.addEventListener("nexa-saved-listings-changed", onSaved);
    return () => {
      window.removeEventListener("nexa-saved-listings-changed", onSaved);
      clearTimer();
    };
  }, [userId]);

  return (
    <>
      {onboarding ? (
        <SavedOnboardingSheet snapshot={onboarding} onClose={() => setOnboarding(null)} />
      ) : null}
      <SavedToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
