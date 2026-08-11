"use client";

import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { HostPortalShell } from "@/components/host/portal/HostPortalShell";

/**
 * Host Portal chrome for approved-host destinations.
 * Verification gates remain page-level (safer than layout redirect for
 * NOT_STARTED / PENDING / REJECTED).
 */
export default function HostPortalLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <HostPortalShell>{children}</HostPortalShell>
    </ProtectedRoute>
  );
}
