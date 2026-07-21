import type { CropArea } from "./image-pipeline";

export const PENDING_UPLOAD_VERSION = 1;
const DB_NAME = "nexa_attachment_drafts";
const DB_VERSION = 1;
const PENDING_STORE = "pending_uploads";
const BLOBS_STORE = "blobs";

export interface PendingUploadFileMeta {
  id: string;
  name: string;
  mime: string;
  size: number;
  lastModified: number;
  kind: "image" | "file";
  rotation: number;
  crop?: CropArea;
  blobKey: string;
  status: "queued" | "processing" | "uploading" | "done" | "failed";
  attachmentId?: string;
}

export interface PendingUploadRecord {
  version: number;
  conversationId: string;
  clientMessageId: string;
  sessionId: string | null;
  caption: string;
  messageType: "IMAGE" | "FILE";
  updatedAt: number;
  files: PendingUploadFileMeta[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("Failed to open DB"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("drafts")) {
        db.createObjectStore("drafts", { keyPath: "conversationId" });
      }
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE, { keyPath: "conversationId" });
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

export async function savePendingUpload(
  record: PendingUploadRecord,
  blobs: Map<string, Blob>,
): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([PENDING_STORE, BLOBS_STORE], "readwrite");
  tx.objectStore(PENDING_STORE).put(record);
  for (const [key, blob] of blobs) {
    tx.objectStore(BLOBS_STORE).put(blob, key);
  }
  await txDone(tx);
  db.close();
}

export async function loadPendingUpload(
  conversationId: string,
): Promise<{ record: PendingUploadRecord; blobs: Map<string, Blob> } | null> {
  const db = await openDb();
  const tx = db.transaction([PENDING_STORE, BLOBS_STORE], "readonly");
  const record = await new Promise<PendingUploadRecord | undefined>((resolve, reject) => {
    const req = tx.objectStore(PENDING_STORE).get(conversationId);
    req.onsuccess = () => resolve(req.result as PendingUploadRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  if (!record || record.version !== PENDING_UPLOAD_VERSION) {
    db.close();
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

export async function clearPendingUpload(conversationId: string): Promise<void> {
  const db = await openDb();
  const existing = await new Promise<PendingUploadRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, "readonly");
    const req = tx.objectStore(PENDING_STORE).get(conversationId);
    req.onsuccess = () => resolve(req.result as PendingUploadRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  const tx = db.transaction([PENDING_STORE, BLOBS_STORE], "readwrite");
  tx.objectStore(PENDING_STORE).delete(conversationId);
  if (existing?.files) {
    for (const file of existing.files) {
      tx.objectStore(BLOBS_STORE).delete(file.blobKey);
    }
  }
  await txDone(tx);
  db.close();
}

export async function hasPendingUpload(conversationId: string): Promise<boolean> {
  try {
    const pending = await loadPendingUpload(conversationId);
    return pending != null && pending.record.files.some((f) => f.status !== "done");
  } catch {
    return false;
  }
}
