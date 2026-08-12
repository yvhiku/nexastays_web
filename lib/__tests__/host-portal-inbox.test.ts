/**
 * Host portal inbox integration — path helpers + portal wiring.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  activeConversationIdFromPath,
  inboxBasePathFromPathname,
  isMessagingThreadPath,
} from "../messaging/thread-routes";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("host portal inbox routes", () => {
  it("distinguishes guest and host inbox bases", () => {
    assert.equal(inboxBasePathFromPathname("/en/inbox"), "/inbox");
    assert.equal(inboxBasePathFromPathname("/en/inbox/abc"), "/inbox");
    assert.equal(inboxBasePathFromPathname("/fr/host/inbox"), "/host/inbox");
    assert.equal(inboxBasePathFromPathname("/ar/host/inbox/xyz"), "/host/inbox");
  });

  it("recognizes thread paths for guest and host", () => {
    assert.equal(isMessagingThreadPath("/en/inbox"), false);
    assert.equal(isMessagingThreadPath("/en/inbox/cid"), true);
    assert.equal(isMessagingThreadPath("/en/host/inbox"), false);
    assert.equal(isMessagingThreadPath("/en/host/inbox/cid"), true);
    assert.equal(activeConversationIdFromPath("/en/host/inbox/cid"), "cid");
    assert.equal(activeConversationIdFromPath("/en/inbox/cid"), "cid");
  });

  it("portal inbox routes exist without guest NavBar in portal shell", () => {
    assert.ok(
      existsSync(
        join(root, "app/[locale]/host/(portal)/inbox/page.tsx"),
      ),
    );
    assert.ok(
      existsSync(
        join(root, "app/[locale]/host/(portal)/inbox/[id]/page.tsx"),
      ),
    );
    const layout = read("app/[locale]/host/(portal)/inbox/layout.tsx");
    assert.match(layout, /variant="portal"/);
    assert.doesNotMatch(layout, /NavBar/);
    const shell = read("components/messaging/InboxLayoutShell.tsx");
    assert.match(shell, /variant === "portal"/);
    assert.match(shell, /NavBar/);
  });

  it("portal nav and host entry points target /host/inbox", () => {
    const nav = read("components/host/portal/portal-nav.ts");
    assert.match(nav, /href: "\/host\/inbox"/);
    const quick = read("components/host/dashboard/HostDashboardQuickLinks.tsx");
    assert.match(quick, /href: "\/host\/inbox"/);
    const card = read("components/host/bookings/HostBookingCard.tsx");
    assert.match(card, /\/host\/inbox\/\$\{/);
    const detail = read("components/bookings/HostBookingDetailView.tsx");
    assert.match(detail, /\/host\/inbox\/\$\{/);
    const top = read("components/host/portal/HostPortalTopBar.tsx");
    assert.match(top, /href="\/host\/inbox"/);
  });

  it("HostPortalShell does not hardcode /host/inbox path detection", () => {
    const shell = read("components/host/portal/HostPortalShell.tsx");
    assert.doesNotMatch(shell, /host\/inbox/);
    assert.match(shell, /<main className="flex min-h-0 flex-1 flex-col">/);
  });
});
