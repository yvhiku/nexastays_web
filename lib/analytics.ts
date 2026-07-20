type AnalyticsEventName =
  | "search_submitted"
  | "listing_viewed"
  | "booking_started"
  | "booking_created"
  | "payment_intent_started"
  | "host_dashboard_viewed"
  | "host_calendar_updated"
  | "host_bookings_csv_exported"
  | "guide_viewed"
  | "guide_completed"
  | "guide_dismissed"
  | "guide_skipped"
  | "welcome_shown"
  | "welcome_completed"
  | "search_spotlight_seen"
  | "search_spotlight_clicked"
  | "saved_popup_seen"
  | "saved_popup_cta"
  | "booking_success_seen"
  | "trip_spotlight_seen"
  | "install_guide_shown";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;

  const body = {
    name,
    payload,
    path: window.location.pathname,
    ts: new Date().toISOString(),
  };

  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (!endpoint) {
    if (process.env.NODE_ENV !== "production") {
      // Keep local development observable without shipping user data anywhere.
      console.debug("[analytics]", body);
    }
    return;
  }

  const json = JSON.stringify(body);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([json], { type: "application/json" }));
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true,
  }).catch(() => undefined);
}
