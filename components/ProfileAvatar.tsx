"use client";

import React, { useState, useEffect } from "react";
import { User } from "lucide-react";
import { getIdentityApiBaseUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  /** If user has profile_photo_url set (e.g. "users/me/profile-photo") */
  hasPhoto: boolean;
  /** JWT for auth - required to fetch photo */
  token: string | null;
  /** Active account id — must change when switching users so stale blobs cannot linger */
  userId?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-16 h-16",
  lg: "w-24 h-24",
};

export function ProfileAvatar({
  hasPhoto,
  token,
  userId,
  size = "md",
  className,
}: ProfileAvatarProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const controller = new AbortController();

    setSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    if (!hasPhoto || !token) {
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const url = `${getIdentityApiBaseUrl()}/users/me/profile-photo`;

    void fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        /* aborted or network — leave placeholder */
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [hasPhoto, token, userId]);

  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      // Authenticated profile blobs cannot use next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Profile"
        className={cn("rounded-full object-cover", sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-nexa-primary/20 flex items-center justify-center shrink-0",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      <User
        className={cn(
          "text-nexa-primary",
          size === "sm" ? "h-4 w-4" : size === "md" ? "h-8 w-8" : "h-12 w-12",
        )}
      />
    </div>
  );
}
