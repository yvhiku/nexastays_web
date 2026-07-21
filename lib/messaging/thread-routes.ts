/** True on `/…/inbox/:conversationId` (immersive thread, no bottom nav). */
export function isMessagingThreadPath(pathname: string): boolean {
  return /\/inbox\/[^/]+$/.test(pathname);
}
