"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { InboxListPanel } from "@/components/messaging/InboxListPanel";
import { cn } from "@/lib/utils";
import { activeConversationIdFromPath, isMessagingThreadPath } from "@/lib/messaging/thread-routes";

type Props = {
  children: React.ReactNode;
};

export function InboxLayoutShell({ children }: Props) {
  const pathname = usePathname() ?? "";
  const isThread = isMessagingThreadPath(pathname);
  const activeId = activeConversationIdFromPath(pathname);

  return (
    <>
      <NavBar />
      <main className="flex h-[calc(100dvh-72px)] min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(253,240,243,0.8),transparent_34%),#fdfbfc] pt-[72px] lg:h-[calc(100dvh-80px)] lg:pt-[80px]">
        <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 overflow-hidden">
          <aside
            className={cn(
              "flex min-h-0 w-full shrink-0 flex-col border-e border-nexa-line/60 bg-white/95 shadow-[10px_0_34px_rgba(85,45,65,0.045)] backdrop-blur-xl lg:w-72 xl:w-80",
              isThread ? "hidden lg:flex" : "flex",
            )}
          >
            <InboxListPanel activeConversationId={activeId} />
          </aside>

          <section
            className={cn(
              "relative flex min-h-0 min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#fdfbfc_0%,#fbf6f8_100%)]",
              !isThread ? "hidden lg:flex" : "flex",
            )}
          >
            {children}
          </section>
        </div>
      </main>
    </>
  );
}
