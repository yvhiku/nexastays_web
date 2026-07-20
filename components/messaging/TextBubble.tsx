"use client";

import React from "react";
import { Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageDto } from "@/lib/messaging/messages-api";

type Props = {
  message: MessageDto;
  removedLabel?: string;
};

function StatusIcon({ status }: { status: string }) {
  if (status === "READ") return <CheckCheck className="h-3 w-3 text-nexa-primary" aria-hidden />;
  if (status === "DELIVERED" || status === "PERSISTED") {
    return <Check className="h-3 w-3 text-nexa-ink-4" aria-hidden />;
  }
  if (status === "PENDING" || status === "FAILED") {
    return <Clock className="h-3 w-3 text-nexa-ink-4" aria-hidden />;
  }
  return null;
}

export function TextBubble({ message, removedLabel }: Props) {
  const own = message.isOwn;
  const time = message.sentAt ?? message.createdAt;

  return (
    <div className={cn("flex w-full", own ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
          own
            ? "bg-nexa-primary text-white rounded-br-md"
            : "bg-white border border-nexa-line/60 text-nexa-ink rounded-bl-md",
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {removedLabel ?? message.body ?? ""}
        </p>
        <div
          className={cn(
            "flex items-center gap-1 mt-1.5",
            own ? "justify-end text-white/70" : "justify-start text-nexa-ink-4",
          )}
        >
          <span className="text-[10px] tabular-nums">
            {new Date(time).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          {own ? <StatusIcon status={message.status} /> : null}
        </div>
      </div>
    </div>
  );
}
