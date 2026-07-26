"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { downloadAttachmentFile } from "@/lib/messaging/download-attachment";

export type AttachmentDownloadState =
  | "idle"
  | "preparing"
  | "downloading"
  | "completed"
  | "failed";

export function useAttachmentDownload() {
  const [state, setState] = useState<AttachmentDownloadState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const download = useCallback(
    async (
      url: string,
      filename: string,
      mime?: string | null,
      onFailure?: () => void,
    ) => {
      if (state === "preparing" || state === "downloading") return;
      if (resetTimer.current) clearTimeout(resetTimer.current);
      setState("preparing");
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      setState("downloading");
      try {
        await downloadAttachmentFile(url, filename, mime);
        setState("completed");
      } catch {
        setState("failed");
        onFailure?.();
      }
      resetTimer.current = setTimeout(() => setState("idle"), 2200);
    },
    [state],
  );

  return { state, download };
}
