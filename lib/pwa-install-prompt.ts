export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Listener = () => void;

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferred;
}

export function setDeferredInstallPrompt(event: BeforeInstallPromptEvent | null) {
  deferred = event;
  emit();
}

export function clearDeferredInstallPrompt() {
  deferred = null;
  emit();
}

export function subscribeDeferredInstallPrompt(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Call once from InstallAppPrompt to capture BIP globally. */
export function bindBeforeInstallPromptCapture(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onBip = (e: Event) => {
    e.preventDefault();
    setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
  };
  window.addEventListener("beforeinstallprompt", onBip);
  return () => window.removeEventListener("beforeinstallprompt", onBip);
}
