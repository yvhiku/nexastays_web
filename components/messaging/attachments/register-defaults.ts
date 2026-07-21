"use client";

import { registerAttachmentKind } from "@/lib/messaging/attachments/registry";
import { ImageAttachmentEditor } from "./ImageAttachmentEditor";
import { FileAttachmentEditor } from "./FileAttachmentEditor";

registerAttachmentKind({
  kind: "image",
  enabled: true,
  accept: "image/*,.heic,.heif",
  Editor: ImageAttachmentEditor,
});

registerAttachmentKind({
  kind: "file",
  enabled: true,
  accept: "application/pdf",
  Editor: FileAttachmentEditor,
});

registerAttachmentKind({
  kind: "video",
  enabled: false,
  Editor: null,
});

registerAttachmentKind({
  kind: "voice",
  enabled: false,
  Editor: null,
});

registerAttachmentKind({
  kind: "location",
  enabled: false,
  Editor: null,
});

export {};
