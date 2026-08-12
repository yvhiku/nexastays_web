"use client";

import { InboxLayoutShell } from "@/components/messaging/InboxLayoutShell";

export default function HostPortalInboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <InboxLayoutShell variant="portal">{children}</InboxLayoutShell>
    </div>
  );
}
