"use client";

import React from "react";
import { FileText, ImageIcon, Link2, Mic, Sparkles } from "lucide-react";
import type { MediaCategory } from "./types";

type Props = {
  category: MediaCategory;
  title: string;
  body: string;
};

const icons = {
  all: Sparkles,
  photo: ImageIcon,
  file: FileText,
  voice: Mic,
  link: Link2,
};

export function GalleryEmptyState({ category, title, body }: Props) {
  const Icon = icons[category];
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-nexa-primary/10 bg-[linear-gradient(145deg,#fff,#fcebf0)] text-nexa-primary shadow-messaging-2">
        <Icon className="h-8 w-8" aria-hidden />
      </span>
      <h3 className="mt-5 font-display text-xl font-semibold text-nexa-ink">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-nexa-ink-3">{body}</p>
    </div>
  );
}
