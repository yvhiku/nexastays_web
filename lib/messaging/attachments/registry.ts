"use client";

import type { ComponentType } from "react";
import type { StagedItem } from "@/lib/messaging/AttachmentManager";
import type { CropArea } from "@/lib/messaging/image-pipeline";

export type AttachmentKind = "image" | "file" | "video" | "voice" | "location";

export interface AttachmentEditorProps {
  item: StagedItem;
  onRemove: () => void;
  onCropChange?: (crop: CropArea, rotation: number) => void;
  onRotate?: () => void;
  labels: {
    remove: string;
    rotate: string;
    crop: string;
    comingSoon: string;
  };
}

export interface AttachmentKindDef {
  kind: AttachmentKind;
  enabled: boolean;
  accept?: string;
  Editor: ComponentType<AttachmentEditorProps> | null;
}

const registry = new Map<AttachmentKind, AttachmentKindDef>();

export function registerAttachmentKind(def: AttachmentKindDef): void {
  registry.set(def.kind, def);
}

export function getAttachmentKind(file: File): AttachmentKind {
  if (file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name)) return "image";
  if (file.type === "application/pdf") return "file";
  return "file";
}

export function listAttachmentKinds(): AttachmentKindDef[] {
  return Array.from(registry.values());
}

export function getAttachmentKindDef(kind: AttachmentKind): AttachmentKindDef | undefined {
  return registry.get(kind);
}
