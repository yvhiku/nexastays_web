"use client";

import React from "react";
import { FileText, ImageIcon, MessageCircle, Mic } from "lucide-react";

type Props = {
  messages: number;
  photos: number;
  files: number;
  voice: number;
  labels: { messages: string; photos: string; files: string; voice: string };
};

export function ConversationInsights({ labels, ...counts }: Props) {
  const items = [
    { id: "messages", value: counts.messages, label: labels.messages, icon: MessageCircle },
    { id: "photos", value: counts.photos, label: labels.photos, icon: ImageIcon },
    { id: "files", value: counts.files, label: labels.files, icon: FileText },
    { id: "voice", value: counts.voice, label: labels.voice, icon: Mic },
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 rounded-messaging-dropdown border border-nexa-line bg-nexa-bg p-3" aria-label={labels.messages}>
      {items.map(({ id, value, label, icon: Icon }) => (
        <div key={id} className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-nexa-primary" aria-hidden />
          <div><dt className="sr-only">{label}</dt><dd className="text-xs font-semibold text-nexa-ink-2">{value} {label}</dd></div>
        </div>
      ))}
    </dl>
  );
}
