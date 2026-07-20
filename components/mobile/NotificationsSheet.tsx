"use client";

import React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { SheetHeader } from "@/components/mobile/SheetHeader";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NotificationsSheet({ open, onOpenChange }: Props) {
  const { t, localePath } = useLanguage();
  const { isAuthenticated } = useAuth();

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={t("pwa.notifications")}
      zIndexClassName="z-[80]"
      height="summary"
    >
      <SheetHeader title={t("pwa.notifications")} onClose={() => onOpenChange(false)} />
      <div className="flex flex-col items-center px-2 pb-4 pt-2 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-nexa-primary-soft">
          <Bell className="h-7 w-7 text-nexa-primary" aria-hidden />
        </div>
        {isAuthenticated ? (
          <>
            <p className="text-base font-semibold text-nexa-ink">{t("pwa.notificationsEmptyTitle")}</p>
            <p className="mt-1.5 max-w-[280px] text-sm text-nexa-ink-3">
              {t("pwa.notificationsEmptyBody")}
            </p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold text-nexa-ink">{t("pwa.notificationsSignInTitle")}</p>
            <p className="mt-1.5 max-w-[280px] text-sm text-nexa-ink-3">
              {t("pwa.notificationsSignInBody")}
            </p>
            <Button asChild className="mt-6 min-h-[44px] w-full max-w-xs">
              <Link href={localePath("/login")} onClick={() => onOpenChange(false)}>
                {t("common.signIn")}
              </Link>
            </Button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
