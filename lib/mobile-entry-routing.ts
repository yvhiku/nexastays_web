import { isGuideFinished } from "@/lib/guidance-storage";

const ENGAGE_KEY = "nexa-pwa-engagement";

export type MobileHomeDecision = "stay" | "listings" | "hostDashboard";

export type MobileHomeContext = {
  isAuthenticated: boolean;
  isHostPrimary: boolean;
  hasUtm: boolean;
  isDesktop: boolean;
};

function readSessionCount(): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = localStorage.getItem(ENGAGE_KEY);
    if (!raw) return 1;
    const parsed = JSON.parse(raw) as { sessionCount?: number; hostDashboardOpens?: number };
    return parsed.sessionCount ?? 1;
  } catch {
    return 1;
  }
}

function readHostDashboardOpens(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(ENGAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { hostDashboardOpens?: number };
    return parsed.hostDashboardOpens ?? 0;
  } catch {
    return 0;
  }
}

export function hasMarketingCampaignParams(search: string): boolean {
  const params = new URLSearchParams(search);
  for (const [key] of params.entries()) {
    if (key.startsWith("utm_") || key === "campaign" || key === "gclid" || key === "fbclid") {
      return true;
    }
  }
  return false;
}

export function resolveMobileHomeDecision(ctx: MobileHomeContext): MobileHomeDecision {
  if (ctx.isDesktop) return "stay";
  if (ctx.hasUtm) return "stay";

  if (ctx.isAuthenticated && ctx.isHostPrimary && readHostDashboardOpens() > 0) {
    return "hostDashboard";
  }

  if (ctx.isAuthenticated) {
    return "listings";
  }

  if (!isGuideFinished("welcome")) {
    return "stay";
  }

  if (readSessionCount() > 1) {
    return "listings";
  }

  return "listings";
}
