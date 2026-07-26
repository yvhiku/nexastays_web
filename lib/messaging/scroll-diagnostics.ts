export type MessagingScrollEvent =
  | "route-change"
  | "request-start"
  | "request-finish"
  | "request-stale"
  | "timeline-commit"
  | "controller-start"
  | "geometry-correction"
  | "observer-resize"
  | "observer-mutation"
  | "stabilized"
  | "interrupted"
  | "cleanup"
  | "user-scroll";

export function messagingScrollDebugEnabled(): boolean {
  if (
    process.env.NODE_ENV !== "development" ||
    typeof window === "undefined"
  ) {
    return false;
  }
  try {
    return localStorage.getItem("nexa:messaging-scroll-debug") === "1";
  } catch {
    return false;
  }
}

export function scrollGeometry(element: HTMLElement | null) {
  if (!element) return null;
  return {
    tag: element.tagName,
    scrollTop: element.scrollTop,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    distanceFromBottom: Math.max(
      0,
      element.scrollHeight - element.scrollTop - element.clientHeight,
    ),
  };
}

export function debugMessagingScroll(
  event: MessagingScrollEvent,
  details: Record<string, unknown>,
): void {
  if (!messagingScrollDebugEnabled()) return;
  console.debug(`[messaging:scroll] ${event}`, details);
}
