"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { SignedMedia } from "@/lib/messaging/messages-api";

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function isExpired(media: SignedMedia | null | undefined): boolean {
  if (!media?.expiresAt) return false;
  return Date.now() > new Date(media.expiresAt).getTime();
}

interface UserAvatarProps {
  name: string;
  media?: SignedMedia | null;
  size?: Size;
  className?: string;
}

export function UserAvatar({ name, media, size = "md", className }: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = media?.url && !isExpired(media) && !imgFailed;

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.url}
        alt=""
        className={cn("rounded-full object-cover shrink-0 border border-nexa-line/50", sizeClasses[size], className)}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold shrink-0",
        "bg-nexa-bg-2 text-nexa-primary border-2 border-nexa-primary/20",
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {initials(name || "?")}
    </div>
  );
}
