"use client";

import React from "react";
import { Shield, User, Video } from "lucide-react";
import type { StaysListing } from "@/lib/stays-types";
import { cn } from "@/lib/utils";

interface HostVisibilityCardProps {
  listing: StaysListing;
  /** Host phone/ID shown only after booking confirmed — here we show verification badges only */
  showContact?: boolean;
  t: (key: string) => string;
  className?: string;
}

/**
 * Host trust details visible to client.
 * Shows verification badges: identity, profile photo, walkthrough.
 * Contact (phone) revealed only after booking is confirmed (handled by API/listing response).
 */
export function HostVisibilityCard({
  listing,
  showContact,
  t,
  className,
}: HostVisibilityCardProps) {
  const host = listing.host;
  if (!host) return null;

  const hasWalkthrough = listing.media?.some((m) => m.kind === "WALKTHROUGH");

  return (
    <div
      className={cn(
        "rounded-xl border border-nexa-line bg-nexa-bg-1 p-5",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-nexa-primary" />
        <span className="font-semibold text-nexa-ink text-sm">{t("bookingVerification.hostVerified")}</span>
      </div>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-nexa-primary/20 flex items-center justify-center shrink-0 ring-2 ring-white shadow">
          <User className="h-6 w-6 text-nexa-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-nexa-ink">{host.full_name ?? "Host"}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
              <User className="h-3 w-3" />
              {t("bookingVerification.hostIdentity")}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
              {t("bookingVerification.hostProfilePhoto")}
            </span>
            {hasWalkthrough && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                <Video className="h-3 w-3" />
                {t("bookingVerification.hostWalkthrough")}
              </span>
            )}
          </div>
          {!showContact && (
            <p className="text-xs text-nexa-ink-4 mt-2">{t("bookingVerification.hostContactRevealed")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
