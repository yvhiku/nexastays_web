/**
 * Photo workspace state helpers. Pure and React-free so the async invariants
 * (client id as sole key, remove-during-upload, order independent of upload
 * status) can be unit-tested.
 */
import type { ReplaceListingMediaBody } from "@/lib/stays-types";
import type { MediaCategory, WizardPhoto } from "./form-types";

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** Parallel uploads in flight at once. */
export const PHOTO_UPLOAD_CONCURRENCY = 3;

export type PhotoFileRejection = {
  name: string;
  /** i18n key under `hostListing.wizard.photos.reject.*` */
  reasonKey: "type" | "size";
};

export function validatePhotoFile(file: {
  type: string;
  size: number;
}): PhotoFileRejection["reasonKey"] | null {
  if (!(PHOTO_ALLOWED_TYPES as readonly string[]).includes(file.type)) return "type";
  if (file.size > PHOTO_MAX_BYTES) return "size";
  return null;
}

export type EnqueueResult = {
  photos: WizardPhoto[];
  added: WizardPhoto[];
  rejected: PhotoFileRejection[];
};

export function enqueuePhotos(
  photos: WizardPhoto[],
  files: File[],
  makePreview: (file: File) => string = (f) => URL.createObjectURL(f),
  makeId: () => string = () => crypto.randomUUID(),
): EnqueueResult {
  const added: WizardPhoto[] = [];
  const rejected: PhotoFileRejection[] = [];
  for (const file of files) {
    const reason = validatePhotoFile(file);
    if (reason) {
      rejected.push({ name: file.name, reasonKey: reason });
      continue;
    }
    added.push({
      id: makeId(),
      file,
      preview: makePreview(file),
      category: "OTHER",
      isCover: false,
      uploadStatus: "pending",
    });
  }
  return { photos: [...photos, ...added], added, rejected };
}

export function markUploading(photos: WizardPhoto[], id: string): WizardPhoto[] {
  return photos.map((p) =>
    p.id === id ? { ...p, uploadStatus: "uploading", uploadError: undefined } : p,
  );
}

/** Applies by id — a tile removed mid-flight is a no-op. */
export function markUploaded(
  photos: WizardPhoto[],
  id: string,
  assetId: string,
): WizardPhoto[] {
  if (!photos.some((p) => p.id === id)) return photos;
  return photos.map((p) =>
    p.id === id
      ? { ...p, assetId, file: null, uploadStatus: "uploaded", uploadError: undefined }
      : p,
  );
}

export function markFailed(
  photos: WizardPhoto[],
  id: string,
  error: string,
): WizardPhoto[] {
  if (!photos.some((p) => p.id === id)) return photos;
  return photos.map((p) =>
    p.id === id ? { ...p, uploadStatus: "error", uploadError: error } : p,
  );
}

/** Re-queue a failed tile; keeps its `file`. */
export function retryPhoto(photos: WizardPhoto[], id: string): WizardPhoto[] {
  return photos.map((p) =>
    p.id === id && p.file
      ? { ...p, uploadStatus: "pending", uploadError: undefined }
      : p,
  );
}

export function removePhoto(
  photos: WizardPhoto[],
  id: string,
  revoke: (url: string) => void = (u) => {
    if (u.startsWith("blob:")) URL.revokeObjectURL(u);
  },
): WizardPhoto[] {
  const target = photos.find((p) => p.id === id);
  if (!target) return photos;
  revoke(target.preview);
  return photos.filter((p) => p.id !== id);
}

/** Reorder by an explicit id sequence (drag result). Unknown ids are ignored. */
export function reorderPhotos(photos: WizardPhoto[], orderedIds: string[]): WizardPhoto[] {
  const byId = new Map(photos.map((p) => [p.id, p]));
  const next: WizardPhoto[] = [];
  for (const id of orderedIds) {
    const p = byId.get(id);
    if (p) {
      next.push(p);
      byId.delete(id);
    }
  }
  // Anything not mentioned keeps relative order at the end.
  for (const p of photos) if (byId.has(p.id)) next.push(p);
  return next;
}

/** Keyboard alternative: move one tile by ±1. */
export function movePhoto(photos: WizardPhoto[], id: string, delta: -1 | 1): WizardPhoto[] {
  const from = photos.findIndex((p) => p.id === id);
  if (from === -1) return photos;
  const to = from + delta;
  if (to < 0 || to >= photos.length) return photos;
  const next = [...photos];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function setCover(photos: WizardPhoto[], id: string): WizardPhoto[] {
  if (!photos.some((p) => p.id === id)) return photos;
  return photos.map((p) => ({ ...p, isCover: p.id === id }));
}

export function setCategory(
  photos: WizardPhoto[],
  id: string,
  category: MediaCategory,
): WizardPhoto[] {
  return photos.map((p) => (p.id === id ? { ...p, category } : p));
}

/** Effective cover id: the starred tile, else the first tile. */
export function coverPhotoId(photos: WizardPhoto[]): string | null {
  const starred = photos.find((p) => p.isCover);
  return starred?.id ?? photos[0]?.id ?? null;
}

export function pendingPhotoIds(photos: WizardPhoto[]): string[] {
  return photos.filter((p) => p.uploadStatus === "pending").map((p) => p.id);
}

export function uploadsInFlight(photos: WizardPhoto[]): number {
  return photos.filter((p) => p.uploadStatus === "uploading").length;
}

export function hasUnfinishedUploads(photos: WizardPhoto[]): boolean {
  return photos.some(
    (p) => p.uploadStatus === "pending" || p.uploadStatus === "uploading",
  );
}

/**
 * Media body for `PUT host/listings/:id/media`. Only uploaded tiles are sent,
 * in current array order (`sort_order = index`); the effective cover is
 * resolved with the first-tile fallback.
 */
export function mediaBodyFromPhotos(
  photos: WizardPhoto[],
  walkthroughAssetId?: string | null,
): ReplaceListingMediaBody {
  const uploaded = photos.filter(
    (p): p is WizardPhoto & { assetId: string } =>
      p.uploadStatus === "uploaded" && Boolean(p.assetId),
  );
  const coverId = coverPhotoId(uploaded);
  const media: ReplaceListingMediaBody["media"] = uploaded.map((p, i) => ({
    asset_id: p.assetId,
    kind: "PHOTO" as const,
    sort_order: i,
    category: p.category,
    is_cover: p.id === coverId,
  }));
  if (walkthroughAssetId) {
    media.push({
      asset_id: walkthroughAssetId,
      kind: "WALKTHROUGH",
      sort_order: media.length,
    });
  }
  return { media };
}
