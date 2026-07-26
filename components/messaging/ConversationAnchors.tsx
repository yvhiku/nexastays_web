"use client";

import React from "react";
import { Bookmark } from "lucide-react";

export type ConversationAnchor = { id: string; label: string; messageId: string };

export function ConversationAnchors({
  anchors,
  label,
  onJump,
}: {
  anchors: ConversationAnchor[];
  label: string;
  onJump: (messageId: string) => void;
}) {
  if (!anchors.length) return null;
  return (
    <nav className="mb-3 flex flex-wrap gap-2 overflow-hidden" aria-label={label}>
      {anchors.map((anchor) => (
        <button key={anchor.id} type="button" onClick={() => onJump(anchor.messageId)} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-nexa-line bg-white px-3 text-xs font-semibold text-nexa-ink-3 shadow-messaging-1 hover:border-nexa-primary/20 hover:text-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40">
          <Bookmark className="h-3.5 w-3.5" aria-hidden />{anchor.label}
        </button>
      ))}
    </nav>
  );
}
