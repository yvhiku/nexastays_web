"use client";

import React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  KeyRound,
  MapPin,
  Star,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageDto } from "@/lib/messaging/messages-api";
import { executeCardAction, type CardAction } from "@/lib/messaging/actions/registry";

type CardMeta = {
  schemaVersion?: number;
  cardVersion?: number;
  kind?: string;
  title?: string;
  body?: string;
  icon?: string;
  source?: string;
  actions?: CardAction[];
};

function iconForKind(kind?: string, type?: string) {
  const k = (kind ?? type ?? "").toLowerCase();
  if (k.includes("wifi")) return Wifi;
  if (k.includes("checkin") || k.includes("key")) return KeyRound;
  if (k.includes("location") || k.includes("map")) return MapPin;
  if (k.includes("review") || k.includes("star")) return Star;
  if (k.includes("payment") || k.includes("pay")) return CreditCard;
  if (k.includes("booking") || k.includes("confirmed")) return CalendarCheck;
  return BadgeCheck;
}

type Props = {
  message: MessageDto;
  localePath?: (path: string) => string;
};

export function TimelineCard({ message, localePath = (p) => p }: Props) {
  const meta = (message.metadata ?? {}) as CardMeta;
  const title = meta.title ?? message.body ?? "Update";
  const body = meta.body;
  const Icon = iconForKind(meta.kind, message.type);
  const isSystem = message.isSystem || message.type.startsWith("SYSTEM");

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[92%] rounded-2xl border px-4 py-3 shadow-nexa-sm",
        isSystem
          ? "bg-nexa-bg-2/80 border-nexa-line/60 text-center"
          : "bg-white/90 border-nexa-primary/15",
      )}
    >
      <div className={cn("flex gap-3", isSystem ? "flex-col items-center" : "items-start")}>
        <div
          className={cn(
            "shrink-0 rounded-full p-2",
            isSystem ? "bg-nexa-primary-soft text-nexa-primary" : "bg-nexa-bg-1 text-nexa-primary",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className={cn("min-w-0 flex-1", isSystem && "text-center")}>
          <p className="text-sm font-semibold text-nexa-ink">{title}</p>
          {body ? <p className="text-sm text-nexa-ink-3 mt-1 leading-relaxed">{body}</p> : null}
          {meta.actions && meta.actions.length > 0 ? (
            <div className={cn("flex flex-wrap gap-2 mt-3", isSystem && "justify-center")}>
              {meta.actions.map((action) => {
                const href = action.url ?? action.value;
                if (href && (action.type === "link" || action.type === "url")) {
                  const external = href.startsWith("http");
                  return external ? (
                    <a
                      key={action.id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-nexa-primary text-white hover:opacity-90"
                    >
                      {action.label}
                    </a>
                  ) : (
                    <Link
                      key={action.id}
                      href={localePath(href)}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-nexa-primary text-white hover:opacity-90"
                    >
                      {action.label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => executeCardAction(action as CardAction, { localePath })}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-nexa-primary text-white hover:opacity-90"
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
      {message.sentAt ? (
        <p className="text-[10px] text-nexa-ink-4 mt-2 text-center tabular-nums">
          {new Date(message.sentAt).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      ) : null}
    </div>
  );
}
