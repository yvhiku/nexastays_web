"use client";

import React, { useState } from "react";
import { Share2, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  text?: string;
  url?: string;
  className?: string;
};

export function ShareButton({ title, text, url, className }: Props) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title, text: text || title, url: shareUrl });
        return;
      }
    } catch {
      /* user cancelled or share failed — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl border border-nexa-line bg-white px-3 text-sm font-medium text-nexa-ink hover:border-nexa-primary/40",
        className,
      )}
      aria-label={t("pwa.share")}
    >
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
      {copied ? t("pwa.linkCopied") : t("pwa.share")}
    </button>
  );
}
