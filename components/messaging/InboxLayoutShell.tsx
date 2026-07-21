"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { InboxListPanel } from "@/components/messaging/InboxListPanel";
import { ReservationSummarySidebar } from "@/components/messaging/ReservationSummarySidebar";
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
      <main className="flex h-[calc(100dvh-72px)] min-h-0 flex-col overflow-hidden bg-[#fcf9f8] pt-[72px] lg:h-[calc(100dvh-80px)] lg:pt-[80px]">
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 overflow-hidden">
          <aside
            className={cn(
              "flex w-full min-h-0 flex-col border-[#F7F7F7] bg-white lg:w-80 lg:border-r xl:w-96",
              isThread ? "hidden lg:flex" : "flex",
            )}
          >
            <InboxListPanel activeConversationId={activeId} />
          </aside>

          <section
            className={cn(
              "relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#fcf9f8]",
              !isThread ? "hidden lg:flex" : "flex",
            )}
          >
            {children}
          </section>

          {isThread && activeId ? (
            <aside className="hidden min-h-0 w-96 shrink-0 flex-col overflow-hidden border-l border-[#F7F7F7] bg-white xl:flex">
              <ReservationSummarySidebar conversationId={activeId} />
            </aside>
          ) : null}
        </div>
      </main>
    </>
  );
}
