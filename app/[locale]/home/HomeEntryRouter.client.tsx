"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasMarketingCampaignParams,
  resolveMobileHomeDecision,
} from "@/lib/mobile-entry-routing";

type Props = {
  children: React.ReactNode;
};

export function HomeEntryRouter({ children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { localePath } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const isHostPrimary =
      window.location.pathname.includes("/host/dashboard") ||
      window.location.pathname.includes("/host/listings");

    const decision = resolveMobileHomeDecision({
      isAuthenticated,
      isHostPrimary,
      hasUtm: hasMarketingCampaignParams(window.location.search),
      isDesktop,
    });

    if (decision === "listings") {
      router.replace(localePath("/listings"));
      return;
    }
    if (decision === "hostDashboard") {
      router.replace(localePath("/host/dashboard"));
      return;
    }

    setReady(true);
  }, [isAuthenticated, localePath, router, searchParams]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center pt-[72px]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-nexa-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
