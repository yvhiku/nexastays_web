"use client";

import React from "react";
import { Search, X } from "lucide-react";

export const ConversationSearchBar = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    placeholder: string;
    clearLabel: string;
    shortcut?: string;
    onChange: (value: string) => void;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  }
>(function ConversationSearchBar(
  { value, placeholder, clearLabel, shortcut, onChange, onKeyDown },
  ref,
) {
  return (
    <div className="flex h-12 items-center gap-2 rounded-messaging-search border border-nexa-line bg-white px-3 shadow-messaging-1 focus-within:border-nexa-primary/35 focus-within:ring-2 focus-within:ring-nexa-primary/15">
      <Search className="h-5 w-5 shrink-0 text-nexa-primary" aria-hidden />
      <input
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-nexa-ink placeholder:text-nexa-ink-4 focus:outline-none"
      />
      {value ? (
        <button type="button" onClick={() => onChange("")} className="flex h-10 w-10 items-center justify-center rounded-full text-nexa-ink-3 hover:bg-nexa-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40" aria-label={clearLabel}>
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : shortcut ? (
        <kbd className="hidden rounded-lg border border-nexa-line bg-nexa-bg px-2 py-1 text-[10px] font-semibold text-nexa-ink-4 sm:inline">{shortcut}</kbd>
      ) : null}
    </div>
  );
});
