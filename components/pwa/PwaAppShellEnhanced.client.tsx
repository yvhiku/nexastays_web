"use client";

import { useEffect, useState } from "react";
import { runAfterIdle } from "@/lib/defer-after-idle";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { GetAppBanner } from "@/components/pwa/GetAppBanner";
import { PwaSplash } from "@/components/pwa/PwaSplash";
import { SavedExperienceHost } from "@/components/saved/SavedExperienceHost";
import { ProductGuidanceProvider } from "@/components/guidance/ProductGuidanceProvider";
import { NexaDebugBoot } from "@/components/pwa/NexaDebugBoot";
import { initAnalytics } from "@/lib/analytics";

function EnhancedFeatures() {
  return (
    <ProductGuidanceProvider>
      <NexaDebugBoot />
      <PwaSplash />
      <GetAppBanner />
      <InstallAppPrompt />
      <SavedExperienceHost />
    </ProductGuidanceProvider>
  );
}

/** Idle-mounted PWA extras: guidance, install prompts, splash, debug. */
export function PwaAppShellEnhanced() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    runAfterIdle(() => {
      initAnalytics();
      setReady(true);
    });
  }, []);

  if (!ready) return null;
  return <EnhancedFeatures />;
}
