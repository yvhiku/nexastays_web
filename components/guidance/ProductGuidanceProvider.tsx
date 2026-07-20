"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobileSearch } from "@/components/search/MobileSearchProvider";
import { WelcomeModal } from "@/components/guidance/WelcomeModal";
import { CelebrationModal } from "@/components/guidance/CelebrationModal";
import { Spotlight } from "@/components/guidance/Spotlight";
import { BottomTip } from "@/components/guidance/BottomTip";
import { InstallSuccessScreen } from "@/components/guidance/InstallSuccessScreen";
import { canShowGuide, sortQueue } from "@/lib/guidance-queue";
import {
  getGuideState,
  markGuideCompleted,
  markGuideDismissed,
  markGuideSeen,
  resetGuide as resetGuideStorage,
  isGuideFinished,
} from "@/lib/guidance-storage";
import {
  trackGuideCompleted,
  trackGuideDismissed,
  trackGuideQueued,
  trackGuideShown,
  trackGuideSkipped,
} from "@/lib/guidance-events";
import type { GuideId, GuideState } from "@/lib/guidance-types";
import { getDeferredInstallPrompt } from "@/lib/pwa-install-prompt";
import {
  noteInstallPromptShown,
  requestInstallPrompt,
} from "@/lib/pwa-install-state";
import {
  dismissInstallPrompt,
  isIosSafari,
  markPwaWelcomeSeen,
  shouldOfferAndroidInstallAfterWelcome,
} from "@/lib/pwa-engagement";

const GAP_MS = 500;
const WELCOME_DELAY_MS = 700;
const WELCOME_RETRY_MS = 2000;

/** Queue item lifecycle for event-driven guidance. */
export type GuideQueuePhase = "READY" | "WAITING" | "SHOWING" | "COMPLETED" | "SKIPPED" | "DISMISSED";

type Api = {
  enqueueGuide: (id: GuideId, opts?: { force?: boolean }) => void;
  completeGuide: (id: GuideId) => void;
  dismissGuide: (id: GuideId) => void;
  skipGuide: (id: GuideId) => void;
  resetGuide: (id: GuideId) => void;
  canShowGuide: (id: GuideId) => boolean;
  markGuideSeen: (id: GuideId) => void;
  markGuideCompleted: (id: GuideId) => void;
  markGuideDismissed: (id: GuideId) => void;
  getGuideState: (id: GuideId) => GuideState;
  activeGuideId: GuideId | null;
  isBusy: boolean;
};

const GuidanceContext = createContext<Api | null>(null);

export function useProductGuidance(): Api {
  const ctx = useContext(GuidanceContext);
  if (!ctx) {
    throw new Error("useProductGuidance must be used within ProductGuidanceProvider");
  }
  return ctx;
}

export function useProductGuidanceOptional(): Api | null {
  return useContext(GuidanceContext);
}

export function ProductGuidanceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { localePath } = useLanguage();
  const { open: searchOpen, openSearch } = useMobileSearch();

  const [active, setActive] = useState<GuideId | null>(null);
  const [fabGlow, setFabGlow] = useState(false);
  const queueRef = useRef<GuideId[]>([]);
  const forceRef = useRef<Set<GuideId>>(new Set());
  const gapTimer = useRef<number | null>(null);
  const welcomeSettled = useRef(false);
  const welcomeRetryTimer = useRef<number | null>(null);

  const pump = useCallback(() => {
    if (active) return;
    if (searchOpen) return;
    const sorted = sortQueue(queueRef.current);
    const next = sorted[0];
    if (!next) return;
    const force = forceRef.current.has(next);
    if (!canShowGuide(next, { bypassCooldown: force })) {
      // Keep waiting in queue until cooldown clears (event-driven WAITING).
      if (gapTimer.current) window.clearTimeout(gapTimer.current);
      gapTimer.current = window.setTimeout(() => {
        gapTimer.current = null;
        pump();
      }, WELCOME_RETRY_MS);
      return;
    }
    queueRef.current = queueRef.current.filter((id) => id !== next);
    forceRef.current.delete(next);
    markGuideSeen(next);
    trackGuideShown(next);
    if (next === "install_app") noteInstallPromptShown();
    setActive(next);
    setFabGlow(next === "search_fab");
  }, [active, searchOpen]);

  const schedulePump = useCallback(
    (delay = GAP_MS) => {
      if (gapTimer.current) window.clearTimeout(gapTimer.current);
      gapTimer.current = window.setTimeout(() => {
        gapTimer.current = null;
        pump();
      }, delay);
    },
    [pump],
  );

  const enqueueGuide = useCallback(
    (id: GuideId, opts?: { force?: boolean }) => {
      if (!canShowGuide(id, { bypassCooldown: opts?.force })) return false;
      if (active === id || queueRef.current.includes(id)) return false;
      if (opts?.force) forceRef.current.add(id);
      queueRef.current = [...queueRef.current, id];
      trackGuideQueued(id);
      if (!active) schedulePump(0);
      return true;
    },
    [active, schedulePump],
  );

  const finishWelcome = useCallback(
    (mode: "complete" | "dismiss") => {
      const afterWelcome: GuideId[] = ["search_fab"];
      if (mode === "complete" && shouldOfferAndroidInstallAfterWelcome()) {
        afterWelcome.unshift("install_app");
        forceRef.current.add("install_app");
      }
      const id = active;
      if (id !== "welcome") return;
      if (mode === "complete") {
        markGuideCompleted(id);
        trackGuideCompleted(id);
      } else {
        markGuideDismissed(id);
        trackGuideDismissed(id);
      }
      markPwaWelcomeSeen();
      setFabGlow(false);
      setActive(null);
      queueRef.current = [...queueRef.current, ...afterWelcome];
      afterWelcome.forEach((gid) => trackGuideQueued(gid));
      schedulePump(GAP_MS);
    },
    [active, schedulePump],
  );

  const finishActive = useCallback(
    (mode: "complete" | "dismiss" | "skip", thenEnqueue?: GuideId) => {
      const id = active;
      if (!id) return;
      if (mode === "complete") {
        markGuideCompleted(id);
        trackGuideCompleted(id);
      } else if (mode === "dismiss") {
        markGuideDismissed(id);
        trackGuideDismissed(id);
      } else {
        markGuideDismissed(id);
        trackGuideSkipped(id);
      }
      if (id === "welcome") markPwaWelcomeSeen();
      setFabGlow(false);
      setActive(null);
      if (thenEnqueue) {
        forceRef.current.add(thenEnqueue);
        queueRef.current = [...queueRef.current, thenEnqueue];
        trackGuideQueued(thenEnqueue);
      }
      schedulePump(GAP_MS);
    },
    [active, schedulePump],
  );

  const completeGuide = useCallback(
    (id: GuideId) => {
      if (active === id) finishActive("complete");
      else {
        markGuideCompleted(id);
        trackGuideCompleted(id);
      }
    },
    [active, finishActive],
  );

  const dismissGuide = useCallback(
    (id: GuideId) => {
      if (active === id) finishActive("dismiss");
      else {
        markGuideDismissed(id);
        trackGuideDismissed(id);
      }
    },
    [active, finishActive],
  );

  const skipGuide = useCallback(
    (id: GuideId) => {
      if (active === id) finishActive("skip");
      else {
        markGuideDismissed(id);
        trackGuideSkipped(id);
      }
    },
    [active, finishActive],
  );

  // home_ready → Welcome (retry if cooldown blocks enqueue)
  useEffect(() => {
    const bare = pathname.replace(/^\/(en|fr|ar)/, "") || "/";
    if (bare !== "/" && bare !== "") return;
    if (welcomeSettled.current) return;

    const clearRetry = () => {
      if (welcomeRetryTimer.current) {
        window.clearTimeout(welcomeRetryTimer.current);
        welcomeRetryTimer.current = null;
      }
    };

    const attemptWelcome = () => {
      if (isGuideFinished("welcome")) {
        welcomeSettled.current = true;
        clearRetry();
        return;
      }
      if (active === "welcome" || queueRef.current.includes("welcome")) {
        welcomeSettled.current = true;
        clearRetry();
        return;
      }
      const ok = enqueueGuide("welcome");
      if (ok) {
        welcomeSettled.current = true;
        clearRetry();
        return;
      }
      welcomeRetryTimer.current = window.setTimeout(attemptWelcome, WELCOME_RETRY_MS);
    };

    const id = window.setTimeout(attemptWelcome, WELCOME_DELAY_MS);
    return () => {
      window.clearTimeout(id);
      clearRetry();
    };
  }, [pathname, enqueueGuide, active]);

  useEffect(() => {
    const onSaved = (e: Event) => {
      const detail = (
        e as CustomEvent<{ action?: string; isFirstSaveEver?: boolean; silent?: boolean }>
      ).detail;
      if (!detail || detail.silent || detail.action !== "saved") return;
      if (detail.isFirstSaveEver) enqueueGuide("save_first", { force: true });
    };
    window.addEventListener("nexa-saved-listings-changed", onSaved);
    return () => window.removeEventListener("nexa-saved-listings-changed", onSaved);
  }, [enqueueGuide]);

  useEffect(() => {
    const onBooking = () => enqueueGuide("booking_success", { force: true });
    window.addEventListener("nexa-guidance-booking-success", onBooking);
    return () => window.removeEventListener("nexa-guidance-booking-success", onBooking);
  }, [enqueueGuide]);

  useEffect(() => {
    const onInstallEligible = () => enqueueGuide("install_app");
    const onInstalledSuccess = () => {
      enqueueGuide("install_success", { force: true });
    };
    const onReviewCompleted = () => {
      enqueueGuide("review_celebration", { force: true });
    };
    window.addEventListener("nexa-guidance-install-eligible", onInstallEligible);
    window.addEventListener("nexa-guidance-install-success", onInstalledSuccess);
    window.addEventListener("nexa-guidance-review-completed", onReviewCompleted);
    return () => {
      window.removeEventListener("nexa-guidance-install-eligible", onInstallEligible);
      window.removeEventListener("nexa-guidance-install-success", onInstalledSuccess);
      window.removeEventListener("nexa-guidance-review-completed", onReviewCompleted);
    };
  }, [enqueueGuide]);

  useEffect(() => {
    if (!searchOpen && !active) schedulePump(GAP_MS);
  }, [searchOpen, active, schedulePump]);

  useEffect(() => {
    document.documentElement.dataset.guidanceFabGlow = fabGlow ? "1" : "0";
    return () => {
      delete document.documentElement.dataset.guidanceFabGlow;
    };
  }, [fabGlow]);

  const api = useMemo<Api>(
    () => ({
      enqueueGuide: (id, opts) => {
        enqueueGuide(id, opts);
      },
      completeGuide,
      dismissGuide,
      skipGuide,
      resetGuide: resetGuideStorage,
      canShowGuide,
      markGuideSeen,
      markGuideCompleted,
      markGuideDismissed,
      getGuideState,
      activeGuideId: active,
      isBusy: active != null,
    }),
    [enqueueGuide, completeGuide, dismissGuide, skipGuide, active],
  );

  const onInstallPrimary = async () => {
    if (isIosSafari()) {
      finishActive("complete");
      return;
    }
    if (!getDeferredInstallPrompt()) {
      // No BIP: tip only — do not mark installed or complete once forever as installed.
      dismissInstallPrompt();
      finishActive("dismiss");
      return;
    }
    const outcome = await requestInstallPrompt();
    if (outcome === "accepted") {
      // Wait for appinstalled → install_success via SM; close tip without marking installed.
      finishActive("complete");
      return;
    }
    if (outcome === "dismissed") {
      finishActive("dismiss");
      return;
    }
    dismissInstallPrompt();
    finishActive("dismiss");
  };

  return (
    <GuidanceContext.Provider value={api}>
      {children}
      {active === "welcome" ? (
        <WelcomeModal
          onContinue={() => finishWelcome("complete")}
          onNotNow={() => finishWelcome("dismiss")}
        />
      ) : null}
      {active === "search_fab" ? (
        <Spotlight
          guideId="search_fab"
          onPrimary={() => {
            finishActive("complete");
            openSearch();
          }}
          onNotNow={() => finishActive("dismiss")}
        />
      ) : null}
      {active === "save_first" ? (
        <CelebrationModal
          guideId="save_first"
          onPrimary={() => {
            finishActive("complete", "saved_tab");
            router.push(localePath("/saved-listings"));
          }}
          onSecondary={() => finishActive("complete", "saved_tab")}
        />
      ) : null}
      {active === "saved_tab" ? (
        <Spotlight
          guideId="saved_tab"
          onPrimary={() => finishActive("complete")}
          onNotNow={() => finishActive("dismiss")}
        />
      ) : null}
      {active === "booking_success" ? (
        <CelebrationModal
          guideId="booking_success"
          onPrimary={() => {
            finishActive("complete", "trips_tab");
            router.push(localePath("/my-bookings"));
          }}
          onSecondary={() => finishActive("complete", "trips_tab")}
        />
      ) : null}
      {active === "review_celebration" ? (
        <CelebrationModal
          guideId="review_celebration"
          onPrimary={() => finishActive("complete")}
          onSecondary={() => finishActive("dismiss")}
        />
      ) : null}
      {active === "trips_tab" ? (
        <Spotlight
          guideId="trips_tab"
          onPrimary={() => finishActive("complete")}
          onNotNow={() => finishActive("dismiss")}
        />
      ) : null}
      {active === "install_app" ? (
        <BottomTip
          variant={isIosSafari() ? "ios" : "android"}
          canNativeInstall={Boolean(getDeferredInstallPrompt())}
          onPrimary={() => void onInstallPrimary()}
          onNotNow={() => {
            dismissInstallPrompt();
            finishActive("dismiss");
          }}
        />
      ) : null}
      {active === "install_success" ? (
        <InstallSuccessScreen onContinue={() => finishActive("complete")} />
      ) : null}
    </GuidanceContext.Provider>
  );
}
