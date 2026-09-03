"use client";

import React from "react";
import { ProfileSkeleton } from "@/components/ui/skeleton";

/** Shown while auth is initializing — skeleton instead of spinner. */
export function AppLoader() {
  return (
    <div className="min-h-screen bg-nexa-bg pt-[calc(72px+env(safe-area-inset-top))]">
      <ProfileSkeleton />
    </div>
  );
}
