"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import type {
  AttachmentDto,
  MessageDto,
} from "@/lib/messaging/messages-api";
import { useLanguage } from "@/contexts/LanguageContext";
import { PremiumTooltip } from "./PremiumTooltip";

const ConversationSearchModal = dynamic(
  () =>
    import("./search/ConversationSearchModal").then(
      (module) => module.ConversationSearchModal,
    ),
  { ssr: false },
);

type Props = {
  conversationId: string;
  token: string | null;
  messages: MessageDto[];
  counterpartName: string;
  viewerRole?: "guest" | "host";
  onJumpToMessage: (messageId: string) => void;
  onOpenGallery: (attachments: AttachmentDto[], index: number) => void;
};

export function ConversationSearchSheet({
  conversationId,
  token,
  messages,
  counterpartName,
  viewerRole,
  onJumpToMessage,
  onOpenGallery,
}: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <>
      <PremiumTooltip label={t("inbox.phase10.searchConversation")}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-nexa-primary transition-[background-color,transform] duration-150 hover:bg-nexa-primary-soft active:scale-95 motion-reduce:transition-none lg:h-10 lg:w-10"
          aria-label={t("inbox.phase10.searchConversation")}
          aria-keyshortcuts="Control+K Meta+K"
        >
          <Search className="h-5 w-5" aria-hidden />
        </button>
      </PremiumTooltip>
      <ConversationSearchModal
        open={open}
        conversationId={conversationId}
        token={token}
        messages={messages}
        counterpartName={counterpartName}
        viewerRole={viewerRole}
        onClose={close}
        onJumpToMessage={onJumpToMessage}
        onOpenGallery={onOpenGallery}
      />
    </>
  );
}
