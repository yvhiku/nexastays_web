"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { ConversationMenu } from "./ConversationMenu";
import type {
  ConversationDetail,
  ConversationPermissions,
} from "@/lib/messaging/messages-api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PremiumStatusPill } from "./polish/PremiumStatusPill";

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
  compact?: boolean;
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
  compact = false,
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

  const backControl = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-nexa-ink-3 transition-[background-color,color,transform] duration-messaging-hover hover:bg-nexa-bg-2 hover:text-nexa-ink active:scale-95 active:duration-messaging-press motion-reduce:transition-none min-[1100px]:hidden"
      aria-label={backLabel}
    >
      <ArrowLeft className="h-[22px] w-[22px] stroke-[1.75] rtl:rotate-180" />
    </button>
  ) : (
    <Link
      href={backHref}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-nexa-ink-3 transition-[background-color,color,transform] duration-messaging-hover hover:bg-nexa-bg-2 hover:text-nexa-ink active:scale-95 active:duration-messaging-press motion-reduce:transition-none min-[1100px]:hidden"
      aria-label={backLabel}
    >
      <ArrowLeft className="h-[22px] w-[22px] stroke-[1.75] rtl:rotate-180" />
    </Link>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-layer-header min-w-0 shrink-0 border-b backdrop-blur-2xl transition-[background-color,border-color,box-shadow] duration-messaging-context ease-out motion-reduce:transition-none",
        compact
          ? "border-nexa-line bg-white/98 shadow-messaging-2"
          : "border-nexa-line/70 bg-white/90 shadow-messaging-1",
      )}
      data-compact={compact || undefined}
    >
      <div className="mx-auto flex h-20 min-w-0 w-full items-center gap-3 px-3 sm:px-4">
        {backControl}
        <div
          className={cn(
            "shrink-0 transform-gpu transition-transform duration-messaging-context ease-out motion-reduce:transition-none",
            compact && "scale-[0.88]",
          )}
        >
          <UserAvatar
            name={presentation.title}
            media={presentation.avatar}
            size="lg"
            className="border-2 border-white ring-1 ring-nexa-line shadow-messaging-1"
          />
        </div>

        <div className="relative min-w-0 flex-1 self-stretch py-3">
          <h1
            className={cn(
              "truncate text-lg font-semibold leading-5 text-nexa-ink transition-transform duration-messaging-context ease-out motion-reduce:transition-none",
              compact && "translate-y-1",
            )}
          >
            {presentation.title}
          </h1>
          <p
            className={cn(
              "mt-1 truncate text-sm font-medium text-nexa-ink-2 transition-[opacity,transform] duration-messaging-context ease-out motion-reduce:transition-none",
              compact && "-translate-y-1 opacity-0",
            )}
          >
            <span className="text-nexa-ink-3">{counterpartRole}</span>
            <span className="px-1.5 text-nexa-ink-4" aria-hidden>
              ·
            </span>
            {presentation.listing.title}
          </p>
          <div
            className={cn(
              "mt-1 flex min-w-0 items-center gap-2 transition-transform duration-messaging-context ease-out motion-reduce:transition-none",
              compact && "-translate-y-3",
            )}
          >
            {presentation.statusChip ? (
              <PremiumStatusPill
                label={presentation.statusChip}
                status={conversation.bookingStatus}
              />
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {toolbarExtra}
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
      </div>
      {contextBar}
    </header>
  );
}
