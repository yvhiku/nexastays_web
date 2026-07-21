import React from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InboxLayoutShell } from "@/components/messaging/InboxLayoutShell";

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <InboxLayoutShell>{children}</InboxLayoutShell>
    </ProtectedRoute>
  );
}
