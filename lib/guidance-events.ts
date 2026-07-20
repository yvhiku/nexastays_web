import { trackEvent } from "@/lib/analytics";
import type { GuideId } from "@/lib/guidance-types";

export function trackGuideQueued(id: GuideId) {
  trackEvent("guide_queued", { guideId: id });
}

export function trackGuideShown(id: GuideId) {
  trackEvent("guide_viewed", { guideId: id });
  trackEvent("guide_shown", { guideId: id });
  if (id === "welcome") trackEvent("welcome_shown", { guideId: id });
  if (id === "search_fab") trackEvent("search_spotlight_seen", { guideId: id });
  if (id === "save_first") trackEvent("saved_popup_seen", { guideId: id });
  if (id === "booking_success") trackEvent("booking_success_seen", { guideId: id });
  if (id === "trips_tab") trackEvent("trip_spotlight_seen", { guideId: id });
  if (id === "install_app") trackEvent("install_guide_shown", { guideId: id });
}

export function trackGuideCompleted(id: GuideId) {
  trackEvent("guide_completed", { guideId: id });
  if (id === "welcome") trackEvent("welcome_completed", { guideId: id });
  if (id === "search_fab") trackEvent("search_spotlight_clicked", { guideId: id });
  if (id === "save_first") trackEvent("saved_popup_cta", { guideId: id });
}

export function trackGuideDismissed(id: GuideId) {
  trackEvent("guide_dismissed", { guideId: id });
}

export function trackGuideSkipped(id: GuideId) {
  trackEvent("guide_skipped", { guideId: id });
}
