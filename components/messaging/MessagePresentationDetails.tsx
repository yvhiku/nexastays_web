"use client";

import React from "react";
import { ExternalLink, Link2, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageDto } from "@/lib/messaging/messages-api";
import { ProgressiveImage } from "./ProgressiveImage";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function firstString(record: RecordValue, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function nestedRecord(
  metadata: RecordValue,
  ...keys: string[]
): RecordValue | null {
  for (const key of keys) {
    const value = asRecord(metadata[key]);
    if (value) return value;
  }
  return null;
}

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function imageUrl(record: RecordValue): string | null {
  const direct = firstString(
    record,
    "imageUrl",
    "image_url",
    "thumbnailUrl",
    "thumbnail_url",
  );
  if (direct) return safeExternalUrl(direct);
  const nested = asRecord(record.image) ?? asRecord(record.thumbnail);
  return nested
    ? safeExternalUrl(firstString(nested, "url", "src"))
    : null;
}

export function ReplyPreview({
  message,
  isOwn,
}: {
  message: MessageDto;
  isOwn: boolean;
}) {
  const reply = nestedRecord(
    message.metadata,
    "replyPreview",
    "reply_preview",
    "quotedMessage",
    "quoted_message",
  );
  if (!reply) return null;

  const sender = firstString(
    reply,
    "senderName",
    "sender_name",
    "author",
    "title",
  );
  const text = firstString(reply, "text", "body", "preview", "caption");
  if (!sender && !text) return null;

  return (
    <div
      className={cn(
        "mb-2 flex min-w-0 gap-2 rounded-2xl border px-3 py-2",
        isOwn
          ? "border-white/20 bg-white/10 text-white"
          : "border-nexa-primary/10 bg-white/80 text-nexa-ink",
      )}
    >
      <MessageSquareQuote
        className={cn(
          "mt-0.5 h-3.5 w-3.5 shrink-0",
          isOwn ? "text-white/75" : "text-nexa-primary",
        )}
        aria-hidden
      />
      <div className="min-w-0">
        {sender ? (
          <p
            className={cn(
              "truncate text-[11px] font-bold",
              isOwn ? "text-white" : "text-nexa-primary",
            )}
          >
            {sender}
          </p>
        ) : null}
        {text ? (
          <p
            className={cn(
              "line-clamp-2 text-xs leading-4",
              isOwn ? "text-white/80" : "text-nexa-ink-3",
            )}
          >
            {text}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function LinkPreview({
  message,
  isOwn,
}: {
  message: MessageDto;
  isOwn: boolean;
}) {
  const preview = nestedRecord(
    message.metadata,
    "linkPreview",
    "link_preview",
    "unfurl",
  );
  if (!preview) return null;

  const url = safeExternalUrl(firstString(preview, "url", "href"));
  const title = firstString(preview, "title", "name");
  const description = firstString(
    preview,
    "description",
    "summary",
    "text",
  );
  const site = firstString(preview, "siteName", "site_name", "domain");
  const thumbnail = imageUrl(preview);
  if (!url || (!title && !description && !thumbnail)) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "mt-2 block overflow-hidden rounded-messaging-card border text-start shadow-messaging-1 transition-[box-shadow,transform] duration-messaging-hover motion-reduce:transition-none lg:hover:-translate-y-px lg:hover:shadow-messaging-2",
        isOwn
          ? "border-white/20 bg-white/10 text-white"
          : "border-nexa-line bg-white text-nexa-ink",
      )}
    >
      {thumbnail ? (
        <ProgressiveImage
          src={thumbnail}
          alt=""
          className="aspect-video max-h-44 w-full"
        />
      ) : null}
      <div className="flex min-w-0 items-start gap-3 p-3.5">
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
            isOwn
              ? "bg-white/15 text-white"
              : "bg-nexa-primary-soft text-nexa-primary",
          )}
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {site ? (
            <p
              className={cn(
                "inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]",
                isOwn ? "text-white/65" : "text-nexa-ink-4",
              )}
            >
              {site}
            </p>
          ) : null}
          {title ? (
            <p className="mt-1 line-clamp-2 text-[14px] font-semibold leading-5">
              {title}
            </p>
          ) : null}
          {description ? (
            <p
              className={cn(
                "mt-1 line-clamp-2 text-xs leading-4",
                isOwn ? "text-white/75" : "text-nexa-ink-3",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
      </div>
    </a>
  );
}
