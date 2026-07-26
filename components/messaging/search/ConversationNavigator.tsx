"use client";

import React from "react";
import { ArrowDown, ArrowUp, Paperclip, Search } from "lucide-react";

export function ConversationNavigator({
  labels,
  onSearch,
  onAttachments,
  onTop,
  onBottom,
}: {
  labels: { search: string; attachments: string; top: string; bottom: string };
  onSearch: () => void;
  onAttachments: () => void;
  onTop: () => void;
  onBottom: () => void;
}) {
  const items = [
    { label: labels.search, icon: Search, action: onSearch },
    { label: labels.attachments, icon: Paperclip, action: onAttachments },
    { label: labels.top, icon: ArrowUp, action: onTop },
    { label: labels.bottom, icon: ArrowDown, action: onBottom },
  ];
  return (
    <nav className="hidden lg:flex lg:flex-col lg:gap-1" aria-label={labels.search}>
      {items.map(({ label, icon: Icon, action }) => (
        <button key={label} type="button" onClick={action} className="flex h-10 w-10 items-center justify-center rounded-full text-nexa-ink-3 hover:bg-nexa-primary-soft hover:text-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40" aria-label={label}>
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </nav>
  );
}
