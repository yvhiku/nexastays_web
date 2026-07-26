"use client";

import React from "react";
import { ExternalLink, MapPin } from "lucide-react";
import type { CardAction } from "@/lib/messaging/actions/registry";
import { executeCardAction } from "@/lib/messaging/actions/registry";
import { getCardPayload } from "@/lib/messaging/message-payload";
import type { CardProps } from "./registry";
import { ProgressiveImage } from "../ProgressiveImage";
import { useLanguage } from "@/contexts/LanguageContext";

function safeMapImage(snapshot: Record<string, unknown> | undefined) {
  if (!snapshot) return null;
  for (const key of ["mapImageUrl", "map_image_url", "imageUrl", "image_url"]) {
    const value = snapshot[key];
    if (typeof value !== "string") continue;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.toString();
      }
    } catch {
      /* ignore malformed optional preview */
    }
  }
  return null;
}

export function LocationCard({ message, localePath }: CardProps) {
  const { locale } = useLanguage();
  const payload = getCardPayload(message);
  const meta = message.metadata as {
    title?: string;
    body?: string;
    actions?: CardAction[];
    snapshot?: Record<string, unknown>;
  };
  const action = (payload?.actions ?? meta.actions ?? [])[0];
  const snapshot = payload?.snapshot ?? meta.snapshot;
  const mapImage = safeMapImage(snapshot);
  const time = message.sentAt ?? message.createdAt;

  return (
    <article className="mx-auto w-full max-w-[460px] overflow-hidden rounded-[24px] border border-nexa-primary/10 bg-white shadow-[0_12px_32px_rgba(76,39,55,0.11)]">
      {mapImage ? (
        <ProgressiveImage
          src={mapImage}
          alt=""
          className="aspect-[2.4/1] w-full"
        />
      ) : (
        <div
          className="relative flex h-28 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_35%,rgba(232,80,122,0.20),transparent_23%),linear-gradient(145deg,#fff5f7,#f6e8ed)]"
          aria-hidden
        >
          <span className="absolute -start-10 top-7 h-px w-52 -rotate-12 bg-nexa-primary/15" />
          <span className="absolute -end-12 bottom-8 h-px w-56 rotate-[18deg] bg-nexa-primary/15" />
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-nexa-primary text-white shadow-[0_9px_24px_rgba(201,58,98,0.28)]">
            <MapPin className="h-5 w-5" />
          </span>
        </div>
      )}
      <div className="flex min-w-0 items-start gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nexa-primary-soft text-nexa-primary">
          <MapPin className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-5 text-nexa-ink">
            {payload?.title ?? meta.title ?? "Location"}
          </h3>
          {payload?.body ?? meta.body ? (
            <p className="mt-1 break-words text-xs leading-5 text-nexa-ink-3">
              {payload?.body ?? meta.body}
            </p>
          ) : null}
          {time ? (
            <time
              dateTime={time}
              className="mt-1.5 block text-[10px] font-medium text-nexa-ink-4"
            >
              {new Date(time).toLocaleTimeString(locale, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </time>
          ) : null}
        </div>
        {action ? (
          <button
            type="button"
            onClick={() => executeCardAction(action, { localePath })}
            className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-nexa-primary px-3 text-[11px] font-bold text-white shadow-[0_6px_16px_rgba(201,58,98,0.22)] transition-[box-shadow,transform] duration-150 hover:-translate-y-px hover:shadow-[0_9px_22px_rgba(201,58,98,0.28)] active:translate-y-0 motion-reduce:transition-none"
          >
            {action.label}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </button>
        ) : null}
      </div>
    </article>
  );
}
