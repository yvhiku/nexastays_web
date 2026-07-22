"use client";

import { useEffect, useState } from "react";
import { isGuideFinished } from "@/lib/guidance-storage";

type Props = {
  children: React.ReactNode;
};

/** Hide heavy marketing on mobile during first-visit onboarding. */
export function CompactHomeMarketing({ children }: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    const onboardingDone = isGuideFinished("welcome");
    setShow(!mobile || onboardingDone);
  }, []);

  if (!show) return null;
  return <>{children}</>;
}
