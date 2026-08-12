import React from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InboxLayoutShell } from "@/components/messaging/InboxLayoutShell";
import { buildPrivateMetadata } from "@/lib/seo/static-route-metadata";

export const metadata = buildPrivateMetadata("Messages | Nexa Stays");

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <InboxLayoutShell variant="guest">{children}</InboxLayoutShell>
    </ProtectedRoute>
  );
}
