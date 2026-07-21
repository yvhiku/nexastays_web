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
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-nexa-bg-2", className)} onClick={onClick}>
      {visible && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
    </div>
  );
}

export function attachmentThumbUrl(a: AttachmentDto): string | null {
  return a.thumbnail?.url ?? a.full?.url ?? null;
}

export function attachmentFullUrl(a: AttachmentDto): string | null {
  return a.full?.url ?? a.thumbnail?.url ?? null;
}
