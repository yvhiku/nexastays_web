"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ConversationMenu } from "./ConversationMenu";
import type { ConversationDetail } from "@/lib/messaging/messages-api";

type Props = {
  conversation: ConversationDetail;
  backHref: string;
  backLabel: string;
  menuLabels: React.ComponentProps<typeof ConversationMenu>["labels"];
  onArchive: () => void;
  onDelete: () => void;
  onReport: (reason?: string) => void;
  onBlock: () => void;
  onSafety: () => void;
  onMuteChange: (muted: boolean) => void;
  muted: boolean;
};

export function ConversationHeader({
  conversation,
  backHref,
  backLabel,
  menuLabels,
  onArchive,
  onDelete,
  onReport,
  onBlock,
  onSafety,
  onMuteChange,
  muted,
}: Props) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 px-3 py-2.5 min-h-[56px] border-b border-nexa-line/60 bg-[rgba(253,251,252,0.95)] backdrop-blur-xl">
      <Link
        href={backHref}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-nexa-ink-3 hover:bg-nexa-bg-2 shrink-0"
        aria-label={backLabel}
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="flex-1 min-w-0">
        <h1 className="font-[family-name:var(--font-playfair)] text-base font-bold text-nexa-ink truncate">
          {conversation.counterpart.name}
        </h1>
        <p className="text-xs text-nexa-ink-4 truncate">{conversation.listing.title}</p>
      </div>
      <ConversationMenu
        permissions={conversation.permissions}
        labels={menuLabels}
        muted={muted}
        onArchive={onArchive}
        onDelete={onDelete}
        onReport={onReport}
        onBlock={onBlock}
        onSafety={onSafety}
        onMuteChange={onMuteChange}
      />
    </header>
  );
}
