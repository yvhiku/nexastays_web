import type { ReactNode } from "react";

/**
 * Padded portal content (dashboard, bookings, listings, analytics, reviews).
 * Inbox uses a sibling bleed layout instead of this group.
 */
export default function HostPortalPaddedContentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex-1 px-4 pb-24 pt-4 md:px-10 md:pb-10 md:pt-6">
      <div className="mx-auto w-full max-w-[1280px]">{children}</div>
    </div>
  );
}
