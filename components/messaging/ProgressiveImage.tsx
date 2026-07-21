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
  /** When true, defer loading until near viewport (default: true in thread). */
  lazy?: boolean;
};

export function ProgressiveImage({
  src,
  alt = "",
  className,
  onClick,
  lazy = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(!lazy);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    if (!lazy || !src) {
      setInView(true);
      return;
    }
    setInView(false);
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy, src]);

  const shouldLoad = src && inView && !failed;

  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-nexa-bg-2", className)} onClick={onClick}>
      {shouldLoad ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={lazy ? "lazy" : "eager"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
      {(!src || failed || (shouldLoad && !loaded)) && (
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
