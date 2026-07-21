"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import type { MessageDto, SignedMedia } from "@/lib/messaging/messages-api";
import type { MessageGroup } from "@/lib/messaging/selectors/group-messages";
import { getMessageText, collapseDeliveryUi } from "@/lib/messaging/message-payload";
import { ImageMessageGrid } from "./ImageMessageGrid";
import { FileMessageRow } from "./FileMessageRow";

type Props = {
  group: MessageGroup;
  counterpartAvatar?: SignedMedia | null;
  counterpartName?: string;
  removedLabel?: string;
  onOpenGallery?: (attachments: MessageDto["attachments"], index: number) => void;
};

function StatusIcon({ deliveryState }: { deliveryState: string }) {
  const ui = collapseDeliveryUi(deliveryState);
  if (ui === "read") return <CheckCheck className="h-3 w-3 text-nexa-primary" aria-hidden />;
  if (ui === "sent") return <Check className="h-3 w-3 text-nexa-ink-4" aria-hidden />;
  return null;
}

export function MessageBubble({
  group,
  counterpartAvatar,
  counterpartName = "Host",
  removedLabel,
  onOpenGallery,
}: Props) {
  const last = group.messages[group.messages.length - 1];
  const time = last.sentAt ?? last.createdAt;
  const anchorId = group.messages[0]?.id;

  return (
    <div
      data-message-id={anchorId}
      className={cn("flex w-full gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200", group.isOwn ? "justify-end" : "justify-start")}
    >
      {!group.isOwn && group.showAvatar ? (
        <UserAvatar name={counterpartName} media={counterpartAvatar} size="sm" className="mt-1" />
      ) : !group.isOwn ? (
        <div className="w-8 shrink-0" aria-hidden />
      ) : null}

      <div className={cn("flex max-w-[85%] flex-col gap-1", group.isOwn ? "items-end" : "items-start")}>
        {group.messages.map((message) => {
          const deleted = Boolean((message.metadata as { deletedAt?: string }).deletedAt);
          if (message.type === "IMAGE" && message.attachments.length > 0) {
            return (
              <ImageMessageGrid
                key={message.id}
                attachments={message.attachments}
                caption={"caption" in message.payload ? message.payload.caption : message.body ?? undefined}
                isOwn={group.isOwn}
                onOpen={(index) => onOpenGallery?.(message.attachments, index)}
              />
            );
          }
          if (message.type === "FILE" && message.attachments.length > 0) {
            return (
              <FileMessageRow
                key={message.id}
                attachment={message.attachments[0]}
                isOwn={group.isOwn}
              />
            );
          }
          return (
            <div
              key={message.id}
              className={cn(
                "rounded-2xl px-4 py-3 shadow-sm",
                group.isOwn
                  ? "bg-[#c13552] text-white rounded-br-[4px]"
                  : "bg-[#eceaea] border border-[#F7F7F7] text-nexa-ink rounded-bl-[4px]",
              )}
            >
              <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
                {deleted ? removedLabel : getMessageText(message)}
              </p>
              {message.deliveryState === "PENDING" && group.isOwn ? (
                <p className="mt-1 text-[10px] opacity-70">Sending…</p>
              ) : null}
            </div>
          );
        })}

        {group.showTimestamp && time ? (
          <div className={cn("flex items-center gap-1 px-1", group.isOwn ? "justify-end" : "justify-start")}>
            <span className="text-[10px] font-bold uppercase tracking-tight tabular-nums text-nexa-ink-4">
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
