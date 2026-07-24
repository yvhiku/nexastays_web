"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { ConversationMenu } from "./ConversationMenu";
import type { ConversationDetail, ConversationPermissions } from "@/lib/messaging/messages-api";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  conversation: ConversationDetail;
  backHref: string;
  backLabel: string;
  onBack?: () => void;
  menuLabels: React.ComponentProps<typeof ConversationMenu>["labels"];
  onArchive: () => void;
  onDelete: () => void;
  onReport: (reason?: string) => void;
  onBlock: () => void;
  onSafety: () => void;
  onMuteChange: (muted: boolean) => void;
  muted: boolean;
  contextBar?: React.ReactNode;
  toolbarExtra?: React.ReactNode;
};

export function ConversationHeader({
  conversation,
  backHref,
  backLabel,
  onBack,
  menuLabels,
  onArchive,
  onDelete,
  onReport,
  onBlock,
  onSafety,
  onMuteChange,
  muted,
  contextBar,
  toolbarExtra,
}: Props) {
  const { presentation, permissions } = conversation;
  const { t } = useLanguage();
  const counterpartRole =
    permissions.viewerRole === "host"
      ? t("inbox.guestRole")
      : presentation.counterpart.verified
        ? t("inbox.verifiedHostRole")
        : t("inbox.hostRole");

  return (
    <header className="z-layer-header shrink-0 border-b border-nexa-primary/10 bg-[rgba(255,252,253,0.96)] shadow-[0_12px_34px_rgba(112,55,79,0.07)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-none items-center gap-2 px-4 lg:max-w-none">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-nexa-primary transition-[background-color,transform] hover:bg-nexa-primary-soft active:scale-95 motion-reduce:transition-none lg:hidden"
            aria-label={backLabel}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
        ) : (
          <Link
            href={backHref}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-nexa-primary transition-[background-color,transform] hover:bg-nexa-primary-soft active:scale-95 motion-reduce:transition-none lg:hidden"
            aria-label={backLabel}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
        )}
        <UserAvatar
          name={presentation.title}
          media={presentation.avatar}
          size="md"
          className="border-2 border-white ring-1 ring-nexa-primary/20 shadow-[0_5px_16px_rgba(96,44,68,0.18)]"
        />
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-base font-bold leading-tight text-nexa-ink">
            {presentation.title}
          </h1>
          <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-nexa-primary/80">
            {counterpartRole} · {presentation.subtitle}
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
        {toolbarExtra}
      </div>
      {contextBar}
    </header>
  );
}
