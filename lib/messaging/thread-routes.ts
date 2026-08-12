/** True on `/…/inbox/:conversationId` or `/…/host/inbox/:conversationId`. */
export function isMessagingThreadPath(pathname: string): boolean {
  return /(?:\/host)?\/inbox\/[^/]+$/.test(pathname);
}

export function activeConversationIdFromPath(pathname: string): string | null {
  const match = pathname.match(/(?:\/host)?\/inbox\/([^/]+)/);
  return match?.[1] ?? null;
}

/**
 * Base path for inbox list/thread links based on current location.
 * Portal sessions stay under `/host/inbox`; guest under `/inbox`.
 */
export function inboxBasePathFromPathname(pathname: string): "/inbox" | "/host/inbox" {
  const stripped = pathname.replace(/^\/(en|fr|ar)(?=\/|$)/, "") || "/";
  const path = stripped.startsWith("/") ? stripped : `/${stripped}`;
  if (path === "/host/inbox" || path.startsWith("/host/inbox/")) {
    return "/host/inbox";
  }
  return "/inbox";
}
