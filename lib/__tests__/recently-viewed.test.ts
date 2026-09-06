import assert from "node:assert/strict";
import test from "node:test";

import {
  getRecentlyViewed,
  pruneUnavailableRecentlyViewed,
  recordRecentlyViewed,
  removeRecentlyViewed,
} from "../recently-viewed";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

function installBrowserGlobals() {
  const events: string[] = [];
  const g = globalThis as Record<string, unknown>;
  g.localStorage = new MemoryStorage();
  g.sessionStorage = new MemoryStorage();
  g.CustomEvent = class CustomEvent {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  };
  g.window = {
    dispatchEvent: (e: { type: string }) => {
      events.push(e.type);
      return true;
    },
  };
  return {
    events,
    cleanup() {
      delete g.localStorage;
      delete g.sessionStorage;
      delete g.CustomEvent;
      delete g.window;
    },
  };
}

test("pruneUnavailableRecentlyViewed drops paused/removed listings (404) and keeps live/unknown", async () => {
  const env = installBrowserGlobals();
  try {
    recordRecentlyViewed({ id: "live-1", title: "Live" });
    recordRecentlyViewed({ id: "paused-1", title: "Paused" });
    recordRecentlyViewed({ id: "flaky-1", title: "Network error" });
    assert.equal(getRecentlyViewed().length, 3);

    const probe = async (id: string) =>
      id === "paused-1" ? false : id === "live-1" ? true : null;
    const gone = await pruneUnavailableRecentlyViewed(probe);

    assert.deepEqual(gone, ["paused-1"]);
    assert.deepEqual(
      getRecentlyViewed().map((x) => x.id),
      ["flaky-1", "live-1"],
    );
    assert.ok(env.events.includes("nexa-recently-viewed-changed"));
  } finally {
    env.cleanup();
  }
});

test("pruneUnavailableRecentlyViewed caches live results per session and re-probes unknowns", async () => {
  const env = installBrowserGlobals();
  try {
    recordRecentlyViewed({ id: "live-1", title: "Live" });
    recordRecentlyViewed({ id: "flaky-1", title: "Flaky" });
    const calls: string[] = [];
    const probe = async (id: string) => {
      calls.push(id);
      return id === "live-1" ? true : null;
    };
    await pruneUnavailableRecentlyViewed(probe);
    await pruneUnavailableRecentlyViewed(probe);
    // live-1 probed once (cached); flaky-1 probed both times (never cached).
    assert.deepEqual(calls.filter((c) => c === "live-1").length, 1);
    assert.deepEqual(calls.filter((c) => c === "flaky-1").length, 2);
  } finally {
    env.cleanup();
  }
});

test("removeRecentlyViewed is a no-op when nothing matches and only writes on change", () => {
  const env = installBrowserGlobals();
  try {
    recordRecentlyViewed({ id: "a", title: "A" });
    const before = env.events.length;
    removeRecentlyViewed(["zzz"]);
    assert.equal(env.events.length, before);
    removeRecentlyViewed(["a"]);
    assert.equal(getRecentlyViewed().length, 0);
    assert.equal(env.events.length, before + 1);
  } finally {
    env.cleanup();
  }
});
