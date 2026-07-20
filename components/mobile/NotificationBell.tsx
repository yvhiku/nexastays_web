"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationsSheet } from "@/components/mobile/NotificationsSheet";

type Props = {
  className?: string;
};

/** Mobile header bell — opens notifications bottom sheet. */
export function NotificationBell({ className }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-nexa-ink-3 hover:bg-nexa-bg-2 active:scale-95",
          className,
        )}
        aria-label={t("pwa.notifications")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
      </button>
      <NotificationsSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
