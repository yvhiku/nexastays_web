"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import type { MessageDto, SignedMedia } from "@/lib/messaging/messages-api";
import type { MessageGroup } from "@/lib/messaging/selectors/group-messages";
import { getMessageText, collapseDeliveryUi, resolveMessageAttachments } from "@/lib/messaging/message-payload";
import { getMediaUploadMeta } from "@/lib/messaging/optimistic-media";
import { ImageMessageGrid } from "./ImageMessageGrid";
import { FileMessageRow } from "./FileMessageRow";

type Props = {
  group: MessageGroup;
  counterpartAvatar?: SignedMedia | null;
  counterpartName?: string;
  removedLabel?: string;
  onOpenGallery?: (attachments: MessageDto["attachments"], index: number) => void;
  onRetryMediaUpload?: (clientMessageId: string) => void;
  uploadLabels?: {
    uploading: string;
    failed: string;
    retry: string;
  };
};

function StatusIcon({ deliveryState }: { deliveryState: string }) {
  const ui = collapseDeliveryUi(deliveryState);
  if (ui === "read") return <CheckCheck className="h-3 w-3 text-nexa-primary" aria-hidden />;
  if (ui === "sent") return <Check className="h-3 w-3 text-nexa-ink-4" aria-hidden />;
  return null;
}

function MessageBubbleInner({
  group,
  counterpartAvatar,
  counterpartName = "Host",
  removedLabel,
  onOpenGallery,
  onRetryMediaUpload,
  uploadLabels,
}: Props) {
  const last = group.messages[group.messages.length - 1];
  const time = last.sentAt ?? last.createdAt;
  const anchorId = group.messages[0]?.id;

  return (
    <div
      data-message-id={anchorId}
      className={cn("flex w-full gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none", group.isOwn ? "justify-end" : "justify-start")}
      style={{ contentVisibility: "auto", containIntrinsicSize: "72px" }}
    >
      {!group.isOwn && group.showAvatar ? (
        <UserAvatar name={counterpartName} media={counterpartAvatar} size="sm" className="mt-1 ring-2 ring-white shadow-nexa-sm" />
      ) : !group.isOwn ? (
        <div className="w-8 shrink-0" aria-hidden />
      ) : null}

      <div className={cn("flex max-w-[78%] flex-col gap-1", group.isOwn ? "items-end" : "items-start")}>
        {group.messages.map((message) => {
          const deleted = Boolean((message.metadata as { deletedAt?: string }).deletedAt);
          const attachments = resolveMessageAttachments(message);
          if (message.type === "IMAGE" && attachments.length > 0) {
            const uploadMeta = getMediaUploadMeta(message);
            return (
              <ImageMessageGrid
                key={message.id}
                attachments={attachments}
                caption={"caption" in message.payload ? message.payload.caption : message.body ?? undefined}
                isOwn={group.isOwn}
                uploadMeta={uploadMeta}
                uploadLabels={uploadLabels}
                onRetryUpload={
                  message.clientMessageId && uploadMeta?.uploadState === "failed"
                    ? () => onRetryMediaUpload?.(message.clientMessageId!)
                    : undefined
                }
                onOpen={(index) => onOpenGallery?.(attachments, index)}
              />
            );
          }
          if (message.type === "FILE" && attachments.length > 0) {
            return (
              <FileMessageRow
                key={message.id}
                attachment={attachments[0]}
                isOwn={group.isOwn}
              />
            );
          }
          if ((message.type === "IMAGE" || message.type === "FILE") && !deleted) {
            return (
              <div
                key={message.id}
                className={cn(
                  "rounded-2xl border px-3.5 py-2.5 text-sm transition-[box-shadow,transform] duration-200 motion-reduce:transition-none hover:-translate-y-px",
                  group.isOwn
                    ? "rounded-br-[5px] border-nexa-primary/20 bg-[linear-gradient(135deg,#f06f91,#e8507a_55%,#c93a62)] text-white shadow-[0_7px_18px_rgba(201,58,98,0.20)]"
                    : "rounded-bl-[5px] border-nexa-line/80 bg-[linear-gradient(145deg,#fff,#fbf5f7)] text-nexa-ink shadow-[0_5px_16px_rgba(77,42,58,0.08)]",
                )}
              >
                {message.type === "IMAGE" ? "Photo" : "File"}
              </div>
            );
          }
          return (
            <div
              key={message.id}
              className={cn(
                "rounded-2xl border px-3.5 py-2.5 transition-[box-shadow,transform] duration-200 motion-reduce:transition-none hover:-translate-y-px",
                group.isOwn
                  ? "rounded-br-[5px] border-nexa-primary/20 bg-[linear-gradient(135deg,#f06f91,#e8507a_55%,#c93a62)] text-white shadow-[0_7px_18px_rgba(201,58,98,0.20)]"
                  : "rounded-bl-[5px] border-nexa-line/80 bg-[linear-gradient(145deg,#fff,#fbf5f7)] text-nexa-ink shadow-[0_5px_16px_rgba(77,42,58,0.08)]",
              )}
            >
              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                {deleted ? removedLabel : getMessageText(message)}
              </p>
              {message.deliveryState === "PENDING" && group.isOwn && !getMediaUploadMeta(message) ? (
                <p className="mt-1 text-[10px] opacity-70">Sending…</p>
              ) : null}
              {message.deliveryState === "PENDING" && group.isOwn && getMediaUploadMeta(message)?.uploadState === "uploading" ? (
                <p className="mt-1 text-[10px] opacity-70">Uploading…</p>
              ) : null}
            </div>
          );
        })}

        {group.showTimestamp && time ? (
          <div className={cn("flex items-center gap-1 px-1", group.isOwn ? "justify-end" : "justify-start")}>
            <span className="text-[10px] font-semibold uppercase tracking-tight tabular-nums text-nexa-ink-3">
              {new Date(time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </span>
            {group.showStatus && group.isOwn ? (
              <StatusIcon deliveryState={last.deliveryState ?? last.status} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const MessageBubble = React.memo(
  MessageBubbleInner,
  (previous, next) =>
    previous.group.isOwn === next.group.isOwn &&
    previous.group.showAvatar === next.group.showAvatar &&
    previous.group.showTimestamp === next.group.showTimestamp &&
    previous.group.showStatus === next.group.showStatus &&
    previous.group.messages.length === next.group.messages.length &&
    previous.group.messages.every(
      (message, index) => message === next.group.messages[index],
    ) &&
    previous.counterpartAvatar?.version === next.counterpartAvatar?.version &&
    previous.counterpartName === next.counterpartName &&
    previous.removedLabel === next.removedLabel &&
    previous.uploadLabels?.uploading === next.uploadLabels?.uploading &&
    previous.uploadLabels?.failed === next.uploadLabels?.failed &&
    previous.uploadLabels?.retry === next.uploadLabels?.retry,
);
