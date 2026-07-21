import { getStaysApiBaseUrl } from "@/lib/env";

function extensionFromMime(mime: string | null | undefined): string {
  if (!mime) return ".jpg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  if (mime.includes("pdf")) return ".pdf";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("webm")) return ".webm";
  if (mime.includes("ogg")) return ".ogg";
  if (mime.includes("mpeg") || mime.includes("mp3")) return ".mp3";
  if (mime.includes("mp4")) return ".m4a";
  return ".jpg";
}

export function attachmentDownloadFilename(
  originalFilename: string | null | undefined,
  mime: string | null | undefined,
): string {
  const trimmed = originalFilename?.trim();
  if (trimmed && /\.[a-z0-9]+$/i.test(trimmed)) return trimmed;
  const base = trimmed?.replace(/\.[^.]+$/, "") || "nexa-attachment";
  return `${base}${extensionFromMime(mime)}`;
}

function saveBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function isAllowedAttachmentUrl(url: string): boolean {
  try {
    const base = getStaysApiBaseUrl().replace(/\/$/, "");
    return url.startsWith(`${base}/messaging/media/attachments/`);
  } catch {
    return false;
  }
}

/** Download a signed messaging attachment (works across origins via app proxy). */
export async function downloadAttachmentFile(
  url: string,
  filename: string,
  mime?: string | null,
): Promise<void> {
  const safeName = attachmentDownloadFilename(filename, mime);

  if (typeof window !== "undefined" && isAllowedAttachmentUrl(url)) {
    try {
      const direct = await fetch(url, { mode: "cors", credentials: "omit" });
      if (direct.ok) {
        saveBlob(await direct.blob(), safeName);
        return;
      }
    } catch {
      /* use same-origin proxy below */
    }

    const proxy = `/api/messaging/attachment-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeName)}`;
    const proxied = await fetch(proxy);
    if (!proxied.ok) {
      throw new Error(`Download failed (${proxied.status})`);
    }
    saveBlob(await proxied.blob(), safeName);
    return;
  }

  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  saveBlob(await res.blob(), safeName);
}
