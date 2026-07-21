"use client";

import React from "react";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import type { MessageDto, SignedMedia } from "@/lib/messaging/messages-api";
import type { MessageGroup } from "@/lib/messaging/selectors/group-messages";

type Props = {
  group: MessageGroup;
  counterpartAvatar?: SignedMedia | null;
  counterpartName?: string;
  removedLabel?: string;
};

function StatusIcon({ status }: { status: string }) {
  if (status === "READ") return <CheckCheck className="h-3 w-3 text-nexa-primary" aria-hidden />;
  if (status === "DELIVERED" || status === "PERSISTED") {
    return <Check className="h-3 w-3 text-nexa-ink-4" aria-hidden />;
  }
  return null;
}

export function MessageBubble({
  group,
  counterpartAvatar,
  counterpartName = "Host",
  removedLabel,
}: Props) {
  const last = group.messages[group.messages.length - 1];
  const time = last.sentAt ?? last.createdAt;

  return (
    <div className={cn("flex w-full gap-2", group.isOwn ? "justify-end" : "justify-start")}>
      {!group.isOwn && group.showAvatar ? (
        <UserAvatar name={counterpartName} media={counterpartAvatar} size="sm" className="mt-1" />
      ) : !group.isOwn ? (
        <div className="w-8 shrink-0" aria-hidden />
      ) : null}

      <div className={cn("flex max-w-[85%] flex-col gap-1", group.isOwn ? "items-end" : "items-start")}>
        {group.messages.map((message) => {
          const deleted = Boolean((message.metadata as { deletedAt?: string }).deletedAt);
          return (
            <div
              key={message.id}
              className={cn(
                "rounded-2xl px-4 py-3 shadow-sm",
                group.isOwn
                  ? "bg-[#c13552] text-white rounded-br-[4px]"
                  : "bg-[#dcd9d9] border border-[#F7F7F7] text-nexa-ink rounded-bl-[4px]",
              )}
            >
              <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
                {deleted ? removedLabel : message.body ?? ""}
              </p>
            </div>
          );
        })}

        {group.showTimestamp && time ? (
          <div
            className={cn(
              "flex items-center gap-1 px-1",
              group.isOwn ? "justify-end text-nexa-ink-4" : "justify-start text-nexa-ink-4",
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-tight tabular-nums">
              {new Date(time).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            {group.showStatus && group.isOwn ? <StatusIcon status={last.status} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
