"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { AttachmentDto } from "@/lib/messaging/messages-api";
import { ImageOff } from "lucide-react";

type Props = {
  src: string | null;
  blurhash?: string | null;
  alt?: string;
  className?: string;
  onClick?: () => void;
  actionLabel?: string;
  errorLabel?: string;
  retryLabel?: string;
  /** When true, defer loading until near viewport (default: true in thread). */
  lazy?: boolean;
};

export function ProgressiveImage({
  src,
  alt = "",
  className,
  onClick,
  actionLabel,
  errorLabel,
  retryLabel,
  lazy = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setAttempt(0);
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
    <div ref={ref} className={cn("relative overflow-hidden bg-[linear-gradient(145deg,#fdf0f3,#f8e9ee)]", className)}>
      {shouldLoad ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${src}-${attempt}`}
          src={src}
          alt={alt}
          loading={lazy ? "lazy" : "eager"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity [transition-duration:250ms] motion-reduce:transition-none",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
      {shouldLoad ? (
        <div
          className={cn(
            "absolute inset-0 bg-[linear-gradient(110deg,#f8e9ee_20%,#fff5f7_42%,#f8e9ee_64%)] transition-opacity [transition-duration:250ms] motion-reduce:transition-none",
            loaded
              ? "pointer-events-none opacity-0"
              : "animate-pulse opacity-100 motion-reduce:animate-none",
          )}
          aria-hidden
        />
      ) : null}
      {!src || failed ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[linear-gradient(145deg,#fdf7f9,#f8e9ee)] px-4 text-center text-nexa-ink-3"
          role="status"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-nexa-primary/10 bg-white/75 text-nexa-primary/60 shadow-sm">
            <ImageOff className="h-5 w-5" aria-hidden />
          </span>
          {errorLabel ? (
            <span className="text-xs font-semibold">{errorLabel}</span>
          ) : null}
          {failed && retryLabel ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setLoaded(false);
                setFailed(false);
                setAttempt((value) => value + 1);
              }}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-nexa-primary/20 bg-white px-3 text-[11px] font-bold text-nexa-primary shadow-sm transition-[background-color,box-shadow,transform] [transition-duration:150ms] hover:bg-nexa-primary-soft active:scale-[0.97] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
            >
              {retryLabel}
            </button>
          ) : null}
        </div>
      ) : null}
      {onClick && !failed && src ? (
        <button
          type="button"
          onClick={onClick}
          className="absolute inset-0 z-layer-content cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-nexa-primary/60"
          aria-label={actionLabel ?? alt}
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
