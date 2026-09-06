"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  isHostPortalPath,
  isImmersiveMobilePath,
} from "@/lib/nav/mobile-chrome";

type Props = {
  children: React.ReactNode;
  isRtl: boolean;
  arabicFontClass?: string;
};

/**
 * Applies mobile bottom-nav padding except on immersive routes (chat / booking
 * detail) and host portal (portal owns its own bottom nav clearance).
 */
export function LocaleShell({ children, isRtl, arabicFontClass }: Props) {
  const pathname = usePathname() ?? "";
  const skipGuestBottomPad =
    isImmersiveMobilePath(pathname) || isHostPortalPath(pathname);

  return (
    <div
      className={cn(
        !skipGuestBottomPad &&
          "pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-0",
        isRtl && arabicFontClass,
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {children}
    </div>
  );
}
