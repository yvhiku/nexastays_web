"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isMessagingThreadPath } from "@/lib/messaging/thread-routes";

type Props = {
  children: React.ReactNode;
  isRtl: boolean;
  arabicFontClass?: string;
};

/** Applies mobile bottom-nav padding except on immersive routes (e.g. chat thread). */
export function LocaleShell({ children, isRtl, arabicFontClass }: Props) {
  const pathname = usePathname() ?? "";
  const immersive = isMessagingThreadPath(pathname);

  return (
    <div
      className={cn(
        !immersive && "pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0",
        isRtl && arabicFontClass,
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {children}
    </div>
  );
}
