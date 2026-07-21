"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { ConversationMenu } from "./ConversationMenu";
import type { ConversationDetail, ConversationPermissions } from "@/lib/messaging/messages-api";

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
  contextBar?: React.ReactNode;
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
  contextBar,
}: Props) {
  const { presentation, permissions } = conversation;

  return (
    <header className="shrink-0 z-50 bg-[rgba(252,249,248,0.92)] backdrop-blur-xl shadow-[0_20px_20px_rgba(34,34,34,0.04)] border-b border-[#F7F7F7]">
      <div className="flex items-center gap-2 px-4 h-16 max-w-2xl mx-auto w-full">
        <Link
          href={backHref}
          className="flex items-center justify-center w-10 h-10 rounded-full text-nexa-primary hover:bg-[#F7F7F7] shrink-0 transition-colors active:scale-95"
          aria-label={backLabel}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <UserAvatar
          name={presentation.title}
          media={presentation.avatar}
          size="md"
          className="border border-[#e0bfc1]"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-nexa-ink leading-tight truncate">
            {presentation.title}
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-wider text-nexa-primary truncate">
            {presentation.subtitle}
          </p>
        </div>
        <ConversationMenu
          permissions={permissions as ConversationPermissions}
          labels={menuLabels}
          muted={muted}
          onArchive={onArchive}
          onDelete={onDelete}
          onReport={onReport}
          onBlock={onBlock}
          onSafety={onSafety}
          onMuteChange={onMuteChange}
        />
      </div>
      {contextBar}
    </header>
  );
}
