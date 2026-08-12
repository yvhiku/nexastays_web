"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { InboxListPanel } from "@/components/messaging/InboxListPanel";
import { cn } from "@/lib/utils";
import {
  activeConversationIdFromPath,
  isMessagingThreadPath,
} from "@/lib/messaging/thread-routes";

type Props = {
  children: React.ReactNode;
  /** guest = NavBar + top offset; portal = fill Host Portal main (no guest NavBar). */
  variant?: "guest" | "portal";
};

export function InboxLayoutShell({
  children,
  variant = "guest",
}: Props) {
  const pathname = usePathname() ?? "";
  const isThread = isMessagingThreadPath(pathname);
  const activeId = activeConversationIdFromPath(pathname);
  const isPortal = variant === "portal";

  const body = (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 overflow-hidden overflow-x-hidden",
        // Guest inbox stays capped/centered; portal fills the Host Portal main.
        !isPortal && "mx-auto max-w-[1500px]",
      )}
    >
      <aside
        className={cn(
          "flex min-h-0 w-full shrink-0 flex-col overflow-x-hidden border-e border-nexa-line bg-white/95 shadow-messaging-1 backdrop-blur-xl",
          isPortal ? "min-[1100px]:w-80 lg:min-[1100px]:w-96" : "min-[1100px]:w-72",
          isThread ? "hidden min-[1100px]:flex" : "flex",
        )}
      >
        <InboxListPanel activeConversationId={activeId} />
      </aside>

      <section
        className={cn(
          "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-[linear-gradient(180deg,#fdfbfc_0%,#fbf6f8_100%)]",
          !isThread ? "hidden min-[1100px]:flex" : "flex",
        )}
      >
        {children}
      </section>
    </div>
  );

  if (isPortal) {
    return (
      <div className="messaging-ui flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden overflow-x-hidden bg-[color:var(--host-surface,#fff)] pb-[calc(env(safe-area-inset-bottom)+4.5rem)] md:pb-0">
        {body}
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <main className="messaging-ui flex h-[100dvh] min-h-0 flex-col overflow-hidden overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(253,240,243,0.8),transparent_34%),#fdfbfc] pt-[calc(var(--nexa-app-banner-h,0px)_+_72px_+_env(safe-area-inset-top))]">
        {body}
      </main>
    </>
  );
}
