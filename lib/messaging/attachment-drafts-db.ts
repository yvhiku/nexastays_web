import type { CropArea } from "./image-pipeline";

export const ATTACHMENT_DRAFT_VERSION = 1;
const DB_NAME = "nexa_attachment_drafts";
const DB_VERSION = 1;
const DRAFTS_STORE = "drafts";
const BLOBS_STORE = "blobs";
const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000;

export interface AttachmentDraftFileMeta {
  id: string;
  name: string;
  mime: string;
  size: number;
  lastModified: number;
  kind: "image" | "file";
  rotation: number;
  crop?: CropArea;
  blobKey: string;
}

export interface AttachmentDraftRecord {
  draftVersion: number;
  conversationId: string;
  draftType: "image" | "file";
  caption: string;
  updatedAt: number;
  files: AttachmentDraftFileMeta[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("Failed to open drafts DB"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: "conversationId" });
      }
      if (!db.objectStoreNames.contains(BLOBS_STORE)) {
        db.createObjectStore(BLOBS_STORE);
      }
    };
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
  });
}

export async function saveAttachmentDraft(record: AttachmentDraftRecord, blobs: Map<string, Blob>): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([DRAFTS_STORE, BLOBS_STORE], "readwrite");
  tx.objectStore(DRAFTS_STORE).put(record);
  for (const [key, blob] of blobs) {
    tx.objectStore(BLOBS_STORE).put(blob, key);
  }
  await txDone(tx);
  db.close();
}

export async function loadAttachmentDraft(
  conversationId: string,
): Promise<{ record: AttachmentDraftRecord; blobs: Map<string, Blob> } | null> {
  const db = await openDb();
  const tx = db.transaction([DRAFTS_STORE, BLOBS_STORE], "readonly");
  const record = await new Promise<AttachmentDraftRecord | undefined>((resolve, reject) => {
    const req = tx.objectStore(DRAFTS_STORE).get(conversationId);
    req.onsuccess = () => resolve(req.result as AttachmentDraftRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  if (!record || record.draftVersion !== ATTACHMENT_DRAFT_VERSION) {
    db.close();
    return null;
  }
  if (Date.now() - record.updatedAt > MAX_DRAFT_AGE_MS) {
    db.close();
    await clearAttachmentDraft(conversationId);
    return null;
  }
  const blobs = new Map<string, Blob>();
  for (const file of record.files) {
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const req = tx.objectStore(BLOBS_STORE).get(file.blobKey);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    if (blob) blobs.set(file.blobKey, blob);
  }
  await txDone(tx);
  db.close();
  return { record, blobs };
}

export async function clearAttachmentDraft(conversationId: string): Promise<void> {
  const db = await openDb();
  const existing = await new Promise<AttachmentDraftRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, "readonly");
    const req = tx.objectStore(DRAFTS_STORE).get(conversationId);
    req.onsuccess = () => resolve(req.result as AttachmentDraftRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  const tx = db.transaction([DRAFTS_STORE, BLOBS_STORE], "readwrite");
  tx.objectStore(DRAFTS_STORE).delete(conversationId);
  if (existing?.files) {
    for (const file of existing.files) {
      tx.objectStore(BLOBS_STORE).delete(file.blobKey);
    }
  }
  await txDone(tx);
  db.close();
}

export async function hasAttachmentDraft(conversationId: string): Promise<boolean> {
  try {
    const draft = await loadAttachmentDraft(conversationId);
    return draft != null && draft.record.files.length > 0;
  } catch {
    return false;
  }
}
