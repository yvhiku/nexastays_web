"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CheckCheck, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import type { MessageDto, SignedMedia } from "@/lib/messaging/messages-api";
import type { MessageGroup } from "@/lib/messaging/selectors/group-messages";
import {
  getMessageText,
  collapseDeliveryUi,
  resolveMessageAttachments,
} from "@/lib/messaging/message-payload";
import { getMediaUploadMeta } from "@/lib/messaging/optimistic-media";
import { useLanguage } from "@/contexts/LanguageContext";
import { ImageMessageGrid } from "./ImageMessageGrid";
import { FileMessageRow } from "./FileMessageRow";
import { LinkPreview, ReplyPreview } from "./MessagePresentationDetails";
import {
  MESSAGING_EASE_OUT,
  MESSAGING_MOTION,
} from "@/lib/messaging/motion";

type Props = {
  group: MessageGroup;
  counterpartAvatar?: SignedMedia | null;
  counterpartName?: string;
  removedLabel?: string;
  onOpenGallery?: (
    attachments: MessageDto["attachments"],
    index: number,
  ) => void;
  onRetryMediaUpload?: (clientMessageId: string) => void;
  uploadLabels?: {
    uploading: string;
    failed: string;
    retry: string;
  };
};

function StatusIcon({ deliveryState }: { deliveryState: string }) {
  if (deliveryState === "PENDING") {
    return (
      <LoaderCircle
        className="h-3.5 w-3.5 animate-spin stroke-[1.75] text-nexa-ink-4 motion-reduce:animate-none"
        aria-hidden
      />
    );
  }
  if (deliveryState === "READ") {
    return (
      <CheckCheck className="h-3.5 w-3.5 stroke-[1.75] text-nexa-primary" aria-hidden />
    );
  }
  if (deliveryState === "DELIVERED") {
    return (
      <CheckCheck className="h-3.5 w-3.5 stroke-[1.75] text-nexa-ink-4" aria-hidden />
    );
  }
  if (collapseDeliveryUi(deliveryState) === "sent") {
    return <Check className="h-3.5 w-3.5 stroke-[1.75] text-nexa-ink-4" aria-hidden />;
  }
  return null;
}

function isStandaloneEmoji(text: string): boolean {
  const compact = text.trim();
  if (!compact || compact.length > 16) return false;
  const withoutEmoji = compact
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u200d\ufe0f\s]/g, "");
  return withoutEmoji.length === 0;
}

function groupedBubbleRadius(
  index: number,
  total: number,
  isOwn: boolean,
): string {
  if (total === 1) return "rounded-messaging-bubble";
  if (index === 0) {
    return isOwn
      ? "rounded-messaging-bubble rounded-ee-[8px]"
      : "rounded-messaging-bubble rounded-es-[8px]";
  }
  if (index === total - 1) {
    return isOwn
      ? "rounded-messaging-bubble rounded-se-[8px]"
      : "rounded-messaging-bubble rounded-ss-[8px]";
  }
  return isOwn
    ? "rounded-messaging-bubble rounded-se-[8px] rounded-ee-[8px]"
    : "rounded-messaging-bubble rounded-ss-[8px] rounded-es-[8px]";
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
  const { locale, t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const last = group.messages[group.messages.length - 1];
  const time = last.sentAt ?? last.createdAt;
  const anchorId = group.messages[0]?.id;
  const isPending = group.messages.some(
    (message) => (message.deliveryState ?? message.status) === "PENDING",
  );
  const deliveryState = last.deliveryState ?? last.status;
  const deliveryLabel =
    deliveryState === "PENDING"
      ? t("inbox.delivery.sending")
      : deliveryState === "READ"
        ? t("inbox.delivery.seen")
        : deliveryState === "DELIVERED"
          ? t("inbox.delivery.delivered")
          : collapseDeliveryUi(deliveryState) === "sent"
            ? t("inbox.delivery.sent")
            : "";

  return (
    <motion.div
      data-message-id={anchorId}
      className={cn(
        "flex w-full gap-3 rounded-messaging-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        group.isOwn ? "justify-end" : "justify-start",
      )}
      tabIndex={0}
      initial={
        reduceMotion
          ? { opacity: 0 }
          : group.isOwn && isPending
            ? { opacity: 0, y: 8, scale: 0.96 }
            : group.isOwn
              ? { opacity: 0, y: 6, scale: 0.98 }
            : { opacity: 0, y: 8 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : isPending
          ? {
              type: "spring",
              duration: MESSAGING_MOTION.message,
              bounce: 0.08,
            }
          : {
              duration: MESSAGING_MOTION.message,
              ease: MESSAGING_EASE_OUT,
            }
      }
      style={{ contentVisibility: "auto", containIntrinsicSize: "76px" }}
    >
      {!group.isOwn && group.showAvatar ? (
        <UserAvatar
          name={counterpartName}
          media={counterpartAvatar}
          size="sm"
          className="mt-1 ring-2 ring-white shadow-messaging-1"
        />
      ) : !group.isOwn ? (
        <div className="w-8 shrink-0" aria-hidden />
      ) : null}

      <div
        className={cn(
          "flex max-w-[82%] flex-col gap-2 md:max-w-[74%] lg:max-w-[68%]",
          group.isOwn ? "items-end" : "items-start",
        )}
      >
        {group.messages.map((message, index) => {
          const deleted = Boolean(
            (message.metadata as { deletedAt?: string }).deletedAt,
          );
          const attachments = resolveMessageAttachments(message);
          if (message.type === "IMAGE" && attachments.length > 0) {
            const uploadMeta = getMediaUploadMeta(message);
            return (
              <ImageMessageGrid
                key={message.id}
                attachments={attachments}
                caption={
                  "caption" in message.payload
                    ? message.payload.caption
                    : message.body ?? undefined
                }
                isOwn={group.isOwn}
                uploadMeta={uploadMeta}
                uploadLabels={uploadLabels}
                onRetryUpload={
                  message.clientMessageId &&
                  uploadMeta?.uploadState === "failed"
                    ? () => onRetryMediaUpload?.(message.clientMessageId!)
                    : undefined
                }
                onOpen={(imageIndex) =>
                  onOpenGallery?.(attachments, imageIndex)
                }
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
          if (
            (message.type === "IMAGE" || message.type === "FILE") &&
            !deleted
          ) {
            return (
              <div
                key={message.id}
                className={cn(
                  "rounded-messaging-bubble border px-4 py-3 text-sm shadow-messaging-1 transition-[background-color,box-shadow,transform] duration-messaging-hover motion-reduce:transition-none lg:hover:-translate-y-px lg:hover:shadow-messaging-2",
                  group.isOwn
                    ? "border-nexa-primary/25 bg-[linear-gradient(145deg,#e8507a_0%,#f06792_100%)] text-white"
                    : "border-nexa-line bg-[linear-gradient(145deg,#fff_0%,#f8f2f5_100%)] text-nexa-ink",
                )}
              >
                {message.type === "IMAGE" ? "Photo" : "File"}
              </div>
            );
          }

          const text = deleted ? removedLabel ?? "" : getMessageText(message);
          const hasStructuredPreview = [
            "replyPreview",
            "reply_preview",
            "quotedMessage",
            "quoted_message",
            "linkPreview",
            "link_preview",
            "unfurl",
          ].some((key) => message.metadata[key] != null);
          const standaloneEmoji =
            !deleted && !hasStructuredPreview && isStandaloneEmoji(text);
          return (
            <div key={message.id} className="min-w-0 max-w-full">
              <div
                className={cn(
                  "border shadow-messaging-1 transition-[background-color,box-shadow,transform] duration-messaging-hover motion-reduce:transition-none lg:hover:-translate-y-px lg:hover:shadow-messaging-2",
                  standaloneEmoji
                    ? "border-transparent bg-transparent px-1 py-0.5 shadow-none"
                    : cn(
                        "px-4 py-3",
                        groupedBubbleRadius(
                          index,
                          group.messages.length,
                          group.isOwn,
                        ),
                      ),
                  group.isOwn
                    ? standaloneEmoji
                      ? "text-nexa-ink"
                      : "border-nexa-primary/25 bg-[linear-gradient(145deg,#e8507a_0%,#f06792_100%)] text-white lg:hover:bg-[linear-gradient(145deg,#e54874_0%,#ef608c_100%)]"
                    : standaloneEmoji
                      ? "text-nexa-ink"
                      : "border-nexa-line bg-[linear-gradient(145deg,#fff_0%,#f8f2f5_100%)] text-nexa-ink lg:hover:bg-white",
                )}
              >
                <ReplyPreview message={message} isOwn={group.isOwn} />
                <p
                  className={cn(
                    "whitespace-pre-wrap [overflow-wrap:anywhere]",
                    standaloneEmoji
                      ? "text-[32px] leading-tight"
                      : "text-[15px] leading-[1.55]",
                    deleted && "italic opacity-75",
                  )}
                >
                  {text}
                </p>
                <LinkPreview message={message} isOwn={group.isOwn} />
              </div>
              <span className="block h-0.5" aria-hidden data-reaction-slot />
            </div>
          );
        })}

        {group.showTimestamp && time ? (
          <div
            className={cn(
              "mt-0.5 flex min-h-4 max-w-full items-center gap-1 whitespace-nowrap px-1",
              group.isOwn ? "justify-end" : "justify-start",
            )}
          >
            <time
              dateTime={time}
              className="shrink-0 text-xs font-medium tabular-nums text-nexa-ink-4"
            >
              {new Date(time).toLocaleTimeString(locale, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </time>
            {group.showStatus && group.isOwn && deliveryLabel ? (
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={deliveryState}
                  className="inline-flex shrink-0 items-center text-nexa-ink-4"
                  role="status"
                  aria-label={deliveryLabel}
                  title={deliveryLabel}
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.72, y: 2 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.82 }
                  }
                  transition={{
                    duration: reduceMotion ? 0 : MESSAGING_MOTION.button,
                    ease: MESSAGING_EASE_OUT,
                  }}
                >
                  <StatusIcon deliveryState={deliveryState} />
                </motion.span>
              </AnimatePresence>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
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
