import type { GuideId, GuideState } from "@/lib/guidance-types";

const STORAGE_KEY = "nexa-product-guidance";
const LEGACY_WELCOME = "nexa-pwa-welcome-seen";
const LEGACY_SAVED_ONBOARDING = "nexa-saved-onboarding-seen";

const EMPTY: GuideState = {
  seen: false,
  completed: false,
  dismissed: false,
  lastShown: null,
};

type Store = Partial<Record<GuideId, GuideState>>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacy();
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function migrateLegacy(): Store {
  const store: Store = {};
  try {
    if (localStorage.getItem(LEGACY_WELCOME) === "1") {
      store.welcome = {
        ...EMPTY,
        seen: true,
        completed: true,
        lastShown: Date.now(),
      };
    }
    if (localStorage.getItem(LEGACY_SAVED_ONBOARDING) === "1") {
      store.save_first = {
        ...EMPTY,
        seen: true,
        completed: true,
        lastShown: Date.now(),
      };
      store.saved_tab = {
        ...EMPTY,
        seen: true,
        completed: true,
        lastShown: Date.now(),
      };
    }
    if (Object.keys(store).length) writeStore(store);
  } catch {
    /* ignore */
  }
  return store;
}

export function getGuideState(id: GuideId): GuideState {
  const store = readStore();
  return store[id] ?? { ...EMPTY };
}

export function markGuideSeen(id: GuideId) {
  const store = readStore();
  const prev = store[id] ?? { ...EMPTY };
  store[id] = { ...prev, seen: true, lastShown: Date.now() };
  writeStore(store);
  if (id === "welcome") {
    try {
      localStorage.setItem(LEGACY_WELCOME, "1");
    } catch {
      /* ignore */
    }
  }
  if (id === "save_first") {
    try {
      localStorage.setItem(LEGACY_SAVED_ONBOARDING, "1");
    } catch {
      /* ignore */
    }
  }
}

export function markGuideCompleted(id: GuideId) {
  const store = readStore();
  const prev = store[id] ?? { ...EMPTY };
  store[id] = {
    ...prev,
    seen: true,
    completed: true,
    lastShown: Date.now(),
  };
  writeStore(store);
  markGuideSeen(id);
}

export function markGuideDismissed(id: GuideId) {
  const store = readStore();
  const prev = store[id] ?? { ...EMPTY };
  store[id] = {
    ...prev,
    seen: true,
    dismissed: true,
    lastShown: Date.now(),
  };
  writeStore(store);
  markGuideSeen(id);
}

export function resetGuide(id: GuideId) {
  const store = readStore();
  delete store[id];
  writeStore(store);
}

/** Clear all product-guidance state (NexaDebug.reset). */
export function resetAllGuides() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_WELCOME);
    localStorage.removeItem(LEGACY_SAVED_ONBOARDING);
  } catch {
    /* ignore */
  }
}

export function isGuideFinished(id: GuideId): boolean {
  const s = getGuideState(id);
  return s.completed || s.dismissed;
}

export function getLastAnyGuideShownAt(): number | null {
  const store = readStore();
  let max: number | null = null;
  for (const s of Object.values(store)) {
    if (s?.lastShown != null && (max == null || s.lastShown > max)) {
      max = s.lastShown;
    }
  }
  return max;
}
