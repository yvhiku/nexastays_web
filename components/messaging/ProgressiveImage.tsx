"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { AttachmentDto } from "@/lib/messaging/messages-api";

type Props = {
  src: string | null;
  blurhash?: string | null;
  alt?: string;
  className?: string;
  onClick?: () => void;
};

export function ProgressiveImage({ src, alt = "", className, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-nexa-bg-2", className)} onClick={onClick}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
      {(!src || failed) && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-nexa-ink-4">
          Photo
        </div>
      )}
    </div>
  );
}

export function attachmentThumbUrl(a: AttachmentDto): string | null {
  return a.thumbnail?.url ?? a.full?.url ?? null;
}

export function attachmentFullUrl(a: AttachmentDto): string | null {
  return a.full?.url ?? a.thumbnail?.url ?? null;
}
