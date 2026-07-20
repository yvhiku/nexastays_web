/**
 * Dev / QA helpers exposed as `window.NexaDebug`.
 */
import { resetAllGuides } from "@/lib/guidance-storage";
import { resetPwaEngagementFlags } from "@/lib/pwa-engagement";
import { resetInstallStateMachine } from "@/lib/pwa-install-state";
import { unregisterAllServiceWorkers } from "@/lib/pwa-sw-update";

declare global {
  interface Window {
    NexaDebug?: {
      reset: () => void;
    };
  }
}

export async function resetNexaClientState() {
  resetAllGuides();
  resetPwaEngagementFlags();
  resetInstallStateMachine();
  try {
    localStorage.removeItem("nexa-saved-onboarding-seen");
  } catch {
    /* ignore */
  }
  await unregisterAllServiceWorkers();
  window.dispatchEvent(new Event("nexa-pwa-engagement-changed"));
  window.dispatchEvent(new Event("nexa-debug-reset"));
}

export function bindNexaDebug() {
  if (typeof window === "undefined") return () => undefined;
  window.NexaDebug = {
    reset: () => {
      void resetNexaClientState().then(() => {
        // Soft reload so welcome / install SM re-bootstrap cleanly.
        window.location.reload();
      });
    },
  };
  return () => {
    delete window.NexaDebug;
  };
}
