/**
 * Image processing pipeline for messaging attachments.
 * Order: decode (HEIC) → crop → rotate → compress → thumbnail → strip EXIF (via re-encode)
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImagePipelineOptions {
  crop?: CropArea;
  rotation?: number;
  maxDimension?: number;
  quality?: number;
  thumbnailMaxPx?: number;
}

export interface ImagePipelineResult {
  file: File;
  thumbnailBlob: Blob;
  width: number;
  height: number;
}

const DEFAULT_MAX = 1600;
const THUMB_MAX = 640;

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

async function decodeToBitmap(file: File): Promise<{ bitmap: ImageBitmap; mime: string }> {
  if (isHeic(file)) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const bitmap = await createImageBitmap(blob as Blob);
    return { bitmap, mime: "image/jpeg" };
  }
  const bitmap = await createImageBitmap(file);
  return { bitmap, mime: file.type.startsWith("image/") ? file.type : "image/jpeg" };
}

function adaptiveMaxDimension(bytes: number): number {
  if (bytes < 2 * 1024 * 1024) return 4096;
  if (bytes < 10 * 1024 * 1024) return DEFAULT_MAX;
  return 1200;
}

function loadImageFromBitmap(bitmap: ImageBitmap): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas unavailable"));
      return;
    }
    ctx.drawImage(bitmap, 0, 0);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = canvas.toDataURL("image/jpeg", 0.92);
  });
}

async function getCroppedCanvas(
  image: HTMLImageElement,
  crop: CropArea,
  rotation = 0,
): Promise<HTMLCanvasElement> {
  const rad = (rotation * Math.PI) / 180;
  const safeArea = Math.ceil(
    Math.max(image.width, image.height) * Math.sqrt(2),
  );

  const canvas = document.createElement("canvas");
  canvas.width = safeArea;
  canvas.height = safeArea;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(rad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(
    Math.max(0, crop.x),
    Math.max(0, crop.y),
    crop.width,
    crop.height,
  );

  const out = document.createElement("canvas");
  out.width = crop.width;
  out.height = crop.height;
  const outCtx = out.getContext("2d");
  if (!outCtx) throw new Error("Canvas unavailable");
  outCtx.putImageData(data, 0, 0);
  return out;
}

function resizeCanvas(
  source: HTMLCanvasElement,
  maxDim: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(source.width, source.height));
  if (scale >= 1) return source;

  const out = document.createElement("canvas");
  out.width = Math.round(source.width * scale);
  out.height = Math.round(source.height * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encode failed"))),
      "image/jpeg",
      quality,
    );
  });
}

export async function processImageFile(
  file: File,
  options: ImagePipelineOptions = {},
): Promise<ImagePipelineResult> {
  const { bitmap } = await decodeToBitmap(file);
  const image = await loadImageFromBitmap(bitmap);
  bitmap.close();

  let canvas: HTMLCanvasElement;
  if (options.crop && options.crop.width > 0 && options.crop.height > 0) {
    canvas = await getCroppedCanvas(image, options.crop, options.rotation ?? 0);
  } else if (options.rotation) {
    const fullCrop: CropArea = { x: 0, y: 0, width: image.width, height: image.height };
    canvas = await getCroppedCanvas(image, fullCrop, options.rotation);
  } else {
    canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(image, 0, 0);
  }

  const maxDim = options.maxDimension ?? adaptiveMaxDimension(file.size);
  const quality = options.quality ?? 0.85;
  const compressed = resizeCanvas(canvas, maxDim);

  const blob = await canvasToBlob(compressed, quality);
  const baseName = file.name.replace(/\.(heic|heif|png|webp|gif|jpe?g)$/i, "");
  const outFile = new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });

  const thumbCanvas = resizeCanvas(compressed, options.thumbnailMaxPx ?? THUMB_MAX);
  const thumbnailBlob = await canvasToBlob(thumbCanvas, 0.82);

  return {
    file: outFile,
    thumbnailBlob,
    width: compressed.width,
    height: compressed.height,
  };
}

export function fileDedupKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export const ATTACHMENT_LIMITS = {
  maxImages: 10,
  maxFileBytes: 20 * 1024 * 1024,
  maxTotalBytes: 100 * 1024 * 1024,
} as const;

export function validateAttachmentBatch(files: File[]): string | null {
  const images = files.filter((f) => f.type.startsWith("image/") || isHeic(f));
  const pdfs = files.filter((f) => f.type === "application/pdf");
  const other = files.length - images.length - pdfs.length;

  if (other > 0) return "Unsupported file type";
  if (images.length && pdfs.length) return "Cannot mix photos and documents in one send";
  if (images.length > ATTACHMENT_LIMITS.maxImages) {
    return `Maximum ${ATTACHMENT_LIMITS.maxImages} photos per send`;
  }

  let total = 0;
  for (const f of files) {
    if (f.size > ATTACHMENT_LIMITS.maxFileBytes) return "Each file must be under 20 MB";
    total += f.size;
  }
  if (total > ATTACHMENT_LIMITS.maxTotalBytes) return "Total size must be under 100 MB";
  return null;
}

export function batchMessageType(files: File[]): "IMAGE" | "FILE" | null {
  if (!files.length) return null;
  const hasImage = files.some((f) => f.type.startsWith("image/") || isHeic(f));
  return hasImage ? "IMAGE" : "FILE";
}
