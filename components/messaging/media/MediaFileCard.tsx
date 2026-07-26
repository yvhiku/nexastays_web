"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  Link2,
  LoaderCircle,
  Mic,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { attachmentFullUrl } from "../ProgressiveImage";
import { useAttachmentDownload } from "../hooks/useAttachmentDownload";
import {
  fileExtension,
  formatFileSize,
  safeHostname,
  type MediaItem,
} from "./types";

type Props = {
  item: MediaItem;
  downloadLabel: string;
  downloadingLabel: string;
  downloadedLabel: string;
  failedLabel: string;
  openLabel: string;
};

function iconFor(item: MediaItem): LucideIcon {
  if (item.category === "link") return Link2;
  if (item.category === "voice") return Mic;
  const extension = fileExtension(item);
  if (["ZIP", "RAR", "7Z", "TAR"].includes(extension)) return FileArchive;
  if (["XLS", "XLSX", "CSV"].includes(extension)) return FileSpreadsheet;
  if (["DOC", "DOCX", "TXT", "RTF"].includes(extension)) return FileType2;
  if (item.attachment?.mime?.startsWith("image/")) return FileImage;
  return FileText;
}

export function MediaFileCard({
  item,
  downloadLabel,
  downloadingLabel,
  downloadedLabel,
  failedLabel,
  openLabel,
}: Props) {
  const { state, download } = useAttachmentDownload();
  const Icon = iconFor(item);
  const url = item.url ?? (item.attachment ? attachmentFullUrl(item.attachment) : null);
  const busy = state === "preparing" || state === "downloading";
  const StateIcon =
    busy
      ? LoaderCircle
      : state === "completed"
        ? CheckCircle2
        : state === "failed"
          ? AlertCircle
          : Download;
  const stateLabel =
    busy
      ? downloadingLabel
      : state === "completed"
        ? downloadedLabel
        : state === "failed"
          ? failedLabel
          : downloadLabel;

  return (
    <article className="group flex min-h-[116px] min-w-0 flex-col justify-between rounded-2xl border border-nexa-line/70 bg-[linear-gradient(145deg,#fff,#fbf6f8)] p-4 shadow-messaging-1 transition-[transform,box-shadow,border-color] duration-150 motion-reduce:transition-none lg:hover:-translate-y-0.5 lg:hover:border-nexa-primary/20 lg:hover:shadow-messaging-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-nexa-primary/10 bg-nexa-primary-soft text-nexa-primary shadow-sm">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words text-sm font-bold leading-5 text-nexa-ink">
            {item.label}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-nexa-ink-4">
            {item.category === "link"
              ? safeHostname(item.url ?? "")
              : [fileExtension(item), formatFileSize(item.attachment?.sizeBytes)]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        </div>
      </div>
      {url ? (
        item.category === "link" ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-nexa-primary/15 bg-white px-4 text-xs font-bold text-nexa-primary transition-[background-color,transform,box-shadow] duration-150 hover:bg-nexa-primary-soft active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
          >
            {openLabel}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        ) : (
          <div className="mt-3">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void download(
                  url,
                  item.attachment?.originalFilename ?? "attachment",
                  item.attachment?.mime,
                  () => window.open(url, "_blank", "noopener,noreferrer"),
                )
              }
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-nexa-primary/15 bg-white px-4 text-xs font-bold text-nexa-primary transition-[background-color,transform,box-shadow] duration-150 hover:bg-nexa-primary-soft active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 disabled:opacity-65"
              aria-live="polite"
            >
              <StateIcon
                className={cn(
                  "h-4 w-4",
                  busy && "animate-spin motion-reduce:animate-none",
                )}
                aria-hidden
              />
              {stateLabel}
            </button>
            {busy ? (
              <div
                className="mt-2 h-1 overflow-hidden rounded-full bg-nexa-primary/10"
                role="progressbar"
                aria-label={downloadingLabel}
              >
                <span className="block h-full w-1/3 animate-[media-download_1s_ease-in-out_infinite] rounded-full bg-nexa-primary motion-reduce:animate-none" />
              </div>
            ) : null}
          </div>
        )
      ) : null}
    </article>
  );
}
