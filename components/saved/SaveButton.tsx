"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  isListingSaved,
  toggleSavedListing,
  type SavedListingSnapshot,
} from "@/lib/saved-listings";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  snapshot: SavedListingSnapshot;
  className?: string;
  iconClassName?: string;
};

export function SaveButton({ listingId, snapshot, className, iconClassName }: Props) {
  const { userId, isAuthenticated } = useAuth();
  const { t, localePath } = useLanguage();
  const router = useRouter();
  const [saved, setSaved] = useState(() => isListingSaved(listingId, userId));
  const [bump, setBump] = useState(0);

  React.useEffect(() => {
    const sync = () => setSaved(isListingSaved(listingId, userId));
    sync();
    window.addEventListener("nexa-saved-listings-changed", sync);
    return () => window.removeEventListener("nexa-saved-listings-changed", sync);
  }, [listingId, userId]);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !userId) {
      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : localePath(`/listings/${listingId}`);
      router.push(`${localePath("/login")}?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }
    const next = toggleSavedListing(listingId, userId, snapshot);
    setSaved(next);
    if (next) setBump((n) => n + 1);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors",
        saved ? "text-nexa-primary" : "text-nexa-ink-4 hover:text-nexa-primary",
        className,
      )}
      aria-label={saved ? t("saved.unsave") : t("saved.save")}
      aria-pressed={saved}
    >
      <motion.span
        key={bump}
        initial={bump > 0 ? { scale: 0.8 } : false}
        animate={{ scale: [0.8, 1.15, 1] }}
        transition={{ duration: 0.28 }}
        className="relative inline-flex"
      >
        <Bookmark
          className={cn("h-4 w-4", saved && "fill-nexa-primary", iconClassName)}
        />
        {bump > 0 && saved ? (
          <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-nexa-primary opacity-80" />
        ) : null}
      </motion.span>
    </button>
  );
}
