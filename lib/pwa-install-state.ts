/**
 * Event-driven PWA install state machine.
 * UI never marks installed — only the `appinstalled` listener does.
 *
 * beforeinstallprompt → CAN_INSTALL
 * requestPrompt()     → PROMPTING
 * userChoice.accepted → ACCEPTED (wait)
 * appinstalled        → INSTALLED
 */
import { trackEvent } from "@/lib/analytics";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  setDeferredInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install-prompt";
import { isStandaloneDisplay, markPwaInstalled, isPwaMarkedInstalled } from "@/lib/pwa-engagement";

export type InstallPhase =
  | "IDLE"
  | "CAN_INSTALL"
  | "PROMPTING"
  | "ACCEPTED"
  | "INSTALLED"
  | "FAILED";

type Listener = (phase: InstallPhase) => void;

let phase: InstallPhase = "IDLE";
let bound = false;
const listeners = new Set<Listener>();

function setPhase(next: InstallPhase) {
  if (phase === next) return;
  phase = next;
  listeners.forEach((l) => l(phase));
  window.dispatchEvent(
    new CustomEvent("nexa-pwa-install-phase", { detail: { phase } }),
  );
}

export function getInstallPhase(): InstallPhase {
  return phase;
}

export function subscribeInstallPhase(listener: Listener): () => void {
  listeners.add(listener);
  listener(phase);
  return () => {
    listeners.delete(listener);
  };
}

function syncInstalledFromEnvironment() {
  if (typeof window === "undefined") return;
  if (isStandaloneDisplay() || isPwaMarkedInstalled()) {
    if (isStandaloneDisplay() && !isPwaMarkedInstalled()) {
      markPwaInstalled();
    }
    setPhase("INSTALLED");
  }
}

function onBeforeInstallPrompt(e: Event) {
  e.preventDefault();
  setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
  if (phase !== "INSTALLED" && phase !== "PROMPTING" && phase !== "ACCEPTED") {
    setPhase("CAN_INSTALL");
  }
}

function onAppInstalled() {
  markPwaInstalled();
  clearDeferredInstallPrompt();
  setPhase("INSTALLED");
  trackEvent("install_completed");
  window.dispatchEvent(new Event("nexa-guidance-install-success"));
}

/** Bind global BIP + appinstalled listeners once (call from InstallAppPrompt). */
export function bindInstallStateMachine(): () => void {
  if (typeof window === "undefined") return () => undefined;
  syncInstalledFromEnvironment();
  if (bound) return () => undefined;
  bound = true;

  if (getDeferredInstallPrompt() && phase !== "INSTALLED") {
    setPhase("CAN_INSTALL");
  }

  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);

  return () => {
    bound = false;
    window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.removeEventListener("appinstalled", onAppInstalled);
  };
}

/**
 * UI entry: request native install prompt.
 * Does NOT mark installed on accepted — waits for appinstalled.
 */
export async function requestInstallPrompt(): Promise<"accepted" | "dismissed" | "unavailable" | "failed"> {
  if (phase === "INSTALLED") return "unavailable";
  const promptEvent = getDeferredInstallPrompt();
  if (!promptEvent) {
    trackEvent("install_prompt_failed", { reason: "no_bip" });
    setPhase(phase === "CAN_INSTALL" ? "IDLE" : phase);
    return "unavailable";
  }

  trackEvent("install_prompt_clicked");
  setPhase("PROMPTING");
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    clearDeferredInstallPrompt();
    if (choice.outcome === "accepted") {
      setPhase("ACCEPTED");
      return "accepted";
    }
    trackEvent("install_prompt_cancelled");
    setPhase("IDLE");
    return "dismissed";
  } catch {
    trackEvent("install_prompt_failed", { reason: "prompt_error" });
    clearDeferredInstallPrompt();
    setPhase("FAILED");
    return "failed";
  }
}

export function noteInstallPromptShown() {
  trackEvent("install_prompt_shown");
}

/** Clear install SM + deferred BIP (for NexaDebug.reset). */
export function resetInstallStateMachine() {
  clearDeferredInstallPrompt();
  phase = "IDLE";
  listeners.forEach((l) => l(phase));
}
