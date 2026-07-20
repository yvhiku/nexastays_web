/**
 * Per-conversation composer drafts (IndexedDB with localStorage fallback).
 */

const DB_NAME = "nexa_messaging";
const STORE = "drafts";
const DB_VERSION = 1;
const LS_PREFIX = "nexa_draft:";

function draftKey(conversationId: string): string {
  return `${LS_PREFIX}${conversationId}`;
}

function readLocal(conversationId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(draftKey(conversationId)) ?? "";
  } catch {
    return "";
  }
}

function writeLocal(conversationId: string, text: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!text.trim()) {
      localStorage.removeItem(draftKey(conversationId));
    } else {
      localStorage.setItem(draftKey(conversationId), text);
    }
  } catch {
    /* quota or private mode */
  }
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function readIdb(conversationId: string): Promise<string | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.get(conversationId);
    req.onsuccess = () => {
      db.close();
      resolve(typeof req.result === "string" ? req.result : null);
    };
    req.onerror = () => {
      db.close();
      resolve(null);
    };
  });
}

async function writeIdb(conversationId: string, text: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    if (!text.trim()) {
      store.delete(conversationId);
    } else {
      store.put(text, conversationId);
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      resolve();
    };
  });
}

export async function loadDraft(conversationId: string): Promise<string> {
  const fromIdb = await readIdb(conversationId);
  if (fromIdb != null) return fromIdb;
  return readLocal(conversationId);
}

export async function saveDraft(conversationId: string, text: string): Promise<void> {
  writeLocal(conversationId, text);
  await writeIdb(conversationId, text);
}

export async function clearDraft(conversationId: string): Promise<void> {
  writeLocal(conversationId, "");
  await writeIdb(conversationId, "");
}
