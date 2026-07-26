"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachmentDto } from "@/lib/messaging/messages-api";
import { attachmentFullUrl } from "./ProgressiveImage";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { useAttachmentDownload } from "./hooks/useAttachmentDownload";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  attachment: AttachmentDto;
  isOwn?: boolean;
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAudioAttachment(attachment: AttachmentDto): boolean {
  const mime = attachment.mime?.toLowerCase() ?? "";
  const name = attachment.originalFilename?.toLowerCase() ?? "";
  return mime.startsWith("audio/") || /\.(webm|ogg|mp3|m4a|wav|aac)$/.test(name);
}

function fileTypeLabel(attachment: AttachmentDto): string {
  const name = attachment.originalFilename ?? "";
  const extension = name.includes(".") ? name.split(".").pop() : null;
  if (extension && extension.length <= 5) return extension.toUpperCase();
  const subtype = attachment.mime?.split("/")[1]?.split(";")[0];
  return subtype?.slice(0, 5).toUpperCase() || "FILE";
}

function fileIcon(type: string, mime: string | null): LucideIcon {
  const normalizedMime = mime?.toLowerCase() ?? "";
  if (["ZIP", "RAR", "7Z", "TAR"].includes(type)) return FileArchive;
  if (["XLS", "XLSX", "CSV"].includes(type)) return FileSpreadsheet;
  if (["DOC", "DOCX", "TXT", "RTF"].includes(type)) return FileType2;
  if (normalizedMime.startsWith("image/")) return FileImage;
  return FileText;
}

export function FileMessageRow({ attachment, isOwn }: Props) {
  const { t } = useLanguage();
  const { state, download } = useAttachmentDownload();
  const url = attachmentFullUrl(attachment);
  const name = attachment.originalFilename ?? t("inbox.phase13.document");
  const isAudio = isAudioAttachment(attachment);
  const type = fileTypeLabel(attachment);
  const Icon = fileIcon(type, attachment.mime);
  const busy = state === "preparing" || state === "downloading";

  if (isAudio && url) {
    return (
      <VoiceMessagePlayer
        src={url}
        isOwn={isOwn}
        durationMs={attachment.durationMs}
      />
    );
  }

  const DownloadStateIcon =
    busy
      ? LoaderCircle
      : state === "completed"
        ? CheckCircle2
        : state === "failed"
          ? AlertCircle
          : Download;
  const downloadLabel = busy
    ? t("common.loading")
    : state === "failed"
      ? t("common.failedLoad")
      : t("inbox.phase11.download");

  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-[340px] overflow-hidden rounded-messaging-bubble border shadow-messaging-1 transition-[box-shadow,transform] duration-messaging-hover motion-reduce:transition-none lg:hover:-translate-y-px lg:hover:shadow-messaging-2",
        isOwn
          ? "border-nexa-primary/25 bg-[linear-gradient(145deg,#e8507a,#f06792)] text-white"
          : "border-nexa-line bg-[linear-gradient(145deg,#fff,#f8f2f5)] text-nexa-ink",
      )}
    >
      <div className="flex min-w-0 items-center gap-3 p-4">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
            isOwn
              ? "border-white/20 bg-white/15 text-white"
              : "border-nexa-primary/10 bg-nexa-primary-soft text-nexa-primary",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-all text-[13px] font-semibold leading-5">
            {name}
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold opacity-70">
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5",
                isOwn ? "border-white/20" : "border-nexa-primary/15",
              )}
            >
              {type}
            </span>
            {attachment.sizeBytes ? (
              <>
                <span aria-hidden>·</span>
                <span>{formatSize(attachment.sizeBytes)}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {url ? (
        <button
          type="button"
          onClick={() =>
            void download(url, name, attachment.mime, () => {
              window.open(url, "_blank", "noopener,noreferrer");
            })
          }
          disabled={busy}
          className={cn(
            "flex min-h-11 w-full items-center justify-center gap-2 border-t px-4 text-xs font-bold transition-[background-color,color] duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
            isOwn
              ? "border-white/15 bg-white/[0.08] text-white hover:bg-white/15 focus-visible:ring-white/60"
              : "border-nexa-primary/10 bg-white/55 text-nexa-primary hover:bg-nexa-primary-soft focus-visible:ring-nexa-primary/40",
          )}
          aria-label={`${downloadLabel} ${name}`}
          aria-live="polite"
        >
          <DownloadStateIcon
            className={cn(
              "h-4 w-4",
              busy && "animate-spin motion-reduce:animate-none",
            )}
            aria-hidden
          />
          <span>{downloadLabel}</span>
        </button>
      ) : null}
    </div>
  );
}
