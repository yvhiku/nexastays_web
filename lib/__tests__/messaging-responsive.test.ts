import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  });
}

test("messaging uses desktop columns and tablet drawer breakpoints", () => {
  const shell = read("components/messaging/InboxLayoutShell.tsx");
  const thread = read("app/[locale]/inbox/[id]/page.tsx");

  assert.match(shell, /max-w-\[1500px\]/);
  assert.match(shell, /min-\[1100px\]:w-72/);
  assert.match(thread, /max-w-\[920px\]/);
  assert.match(thread, /md:block min-\[1400px\]:hidden/);
  assert.match(thread, /className="relative hidden min-h-0 shrink-0 bg-\[#fffafb\] min-\[1400px\]:flex"/);
  assert.match(thread, /Math\.max\(280, Math\.min\(320,/);
  assert.match(thread, /width >= 1400/);
});

test("messaging surfaces do not introduce horizontal scrolling", () => {
  const roots = [
    join(process.cwd(), "components", "messaging"),
    join(process.cwd(), "app", "[locale]", "inbox"),
  ];
  const offenders = roots.flatMap(sourceFiles).filter((path) => {
    if (!/\.(tsx?|jsx?)$/.test(path)) return false;
    return /overflow-x-(auto|scroll)/.test(readFileSync(path, "utf8"));
  });

  assert.deepEqual(offenders, []);
});

test("composer emoji picker renders above the mobile conversation drawer", () => {
  const picker = read("components/messaging/EmojiPickerPopover.tsx");
  const thread = read("app/[locale]/inbox/[id]/page.tsx");

  assert.match(thread, /z-layer-drawer/);
  assert.match(picker, /layer="modal"/);
});

test("composer attachment chooser renders above the mobile conversation drawer", () => {
  const chooser = read("components/messaging/AttachmentActionPopover.tsx");
  const composer = read("components/messaging/MessageComposer.tsx");

  assert.match(chooser, /layer="modal"/);
  assert.match(composer, /aria-haspopup="menu"/);
  assert.match(composer, /onAttachDocument/);
  assert.match(composer, /onShareLocation/);
});

test("conversation back control always navigates to the localized inbox base", () => {
  const thread = read("app/[locale]/inbox/[id]/page.tsx");

  assert.match(
    thread,
    /const navigateBackToInbox = useCallback\(\(\) => \{\s*router\.push\(localePath\(inboxBase\)\)/,
  );
  assert.match(thread, /inboxBasePathFromPathname/);
  assert.match(thread, /onBack=\{navigateBackToInbox\}/);
  assert.doesNotMatch(thread, /ConversationListDrawer/);
});

test("inbox presence animations avoid the ref-unsafe popLayout mode", () => {
  const inbox = read("components/messaging/InboxListPanel.tsx");

  assert.doesNotMatch(inbox, /mode="popLayout"/);
});

test("chat uses one transient scroll date instead of sticky day dividers", () => {
  const thread = read("app/[locale]/inbox/[id]/page.tsx");
  const timeline = read("components/messaging/TimelineRenderer.tsx");
  const hook = read(
    "components/messaging/hooks/useTransientScrollDate.ts",
  );

  assert.match(thread, /useTransientScrollDate/);
  assert.match(thread, /scrollDateVisible && scrollDateLabel/);
  assert.match(timeline, /data-timeline-day-label/);
  assert.doesNotMatch(timeline, /sticky top-2/);
  assert.match(hook, /HIDE_DELAY_MS = 850/);
});

test("phase 7.5 keeps premium bubble geometry responsive", () => {
  const bubble = read("components/messaging/MessageBubble.tsx");

  assert.match(
    bubble,
    /max-w-\[82%\].*md:max-w-\[74%\].*lg:max-w-\[68%\]/,
  );
  assert.match(bubble, /rounded-messaging-bubble/);
  assert.match(bubble, /#e8507a_0%,#f06792_100%/);
  assert.match(bubble, /duration-messaging-hover/);
  assert.match(bubble, /inbox\.delivery\.seen/);
});

test("message delivery uses compact WhatsApp-style checks", () => {
  const bubble = read("components/messaging/MessageBubble.tsx");

  assert.match(
    bubble,
    /deliveryState === "READ"[\s\S]*CheckCheck className="[^"]*text-nexa-primary"/,
  );
  assert.match(
    bubble,
    /deliveryState === "DELIVERED"[\s\S]*CheckCheck className="[^"]*text-nexa-ink-4"/,
  );
  assert.match(
    bubble,
    /collapseDeliveryUi\(deliveryState\) === "sent"[\s\S]*<Check className=/,
  );
  assert.match(bubble, /aria-label=\{deliveryLabel\}/);
  assert.doesNotMatch(bubble, /<span>\{deliveryLabel\}<\/span>/);
});

test("phase 7C media uses stable premium loading and failure states", () => {
  const grid = read("components/messaging/ImageMessageGrid.tsx");
  const image = read("components/messaging/ProgressiveImage.tsx");
  const file = read("components/messaging/FileMessageRow.tsx");

  assert.match(grid, /grid-cols-2 gap-2/);
  assert.match(grid, /rounded-messaging-bubble/);
  assert.match(grid, /col-span-2 h-44/);
  assert.match(image, /\[transition-duration:250ms\]/);
  assert.match(image, /retryLabel/);
  assert.match(file, /rounded-messaging-bubble/);
});

test("phase 14.5 shows a compact control only when new messages arrive below", () => {
  const thread = read("app/[locale]/inbox/[id]/page.tsx");
  const control = read("components/messaging/NewMessagesIndicator.tsx");

  assert.match(thread, /count=\{newMessagesBelow\}/);
  assert.match(control, /count > 0/);
  assert.match(control, /inset-x-0 bottom-4/);
  assert.doesNotMatch(thread, /inbox\.newest/);
});

test("phase 14.6 renders immediately and adjusts to the bottom without a visibility gate", () => {
  const thread = read("app/[locale]/inbox/[id]/page.tsx");
  const scroll = read("components/messaging/hooks/useConversationScroll.ts");
  const policy = read("lib/messaging/scroll-policy.ts");
  const context = read("components/messaging/MessagingContextPanel.tsx");

  assert.match(scroll, /useLayoutEffect/);
  assert.match(scroll, /scrollContainerToBottom\(el\)/);
  assert.match(policy, /INITIAL_BOTTOM_TOLERANCE_PX = 2/);
  assert.match(policy, /INITIAL_BOTTOM_STABLE_MS = 250/);
  assert.match(scroll, /evaluateInitialScrollFrame/);
  assert.match(scroll, /animationFrame = requestAnimationFrame\(lockBottom\)/);
  assert.match(scroll, /new ResizeObserver\(\(\) => pin\("observer-resize"\)\)/);
  assert.doesNotMatch(scroll, /stableTimer|maxTimer/);
  assert.doesNotMatch(scroll, /nexa-conversation-scroll/);
  assert.doesNotMatch(thread, /initialPositioned|initialPositioned \? "visible" : "invisible"/);
  assert.match(thread, /className="h-full min-h-0 min-w-0 overflow-y-auto/);
  assert.match(thread, /scrollContainerRef=\{scrollRef\}/);
  assert.match(
    read("components/messaging/TimelineRenderer.tsx"),
    /scrollMargin,[\s\S]*virtualRow\.start - scrollMargin/,
  );
  assert.match(
    thread,
    /<div className="mx-auto min-w-0 w-full max-w-\[920px\]">[\s\S]*<BookingJourney[\s\S]*<ConversationSummary[\s\S]*<TimelineRenderer/,
  );
  assert.match(context, /inbox\.phase9\.activity/);
});

test("phase 14.7 route loading does not loop when read eligibility changes", () => {
  const thread = read("app/[locale]/inbox/[id]/page.tsx");

  assert.match(thread, /const scheduleReadRef = useRef\(scheduleRead\)/);
  assert.match(thread, /scheduleReadRef\.current\(\)/);
  assert.match(
    thread,
    /const loadConversation = useCallback\([\s\S]*?\}, \[conversationId, token\]\);/,
  );
});

test("phase 7.5 uses one semantic messaging design system", () => {
  const tailwind = read("tailwind.config.ts");
  const composer = read("components/messaging/MessageComposer.tsx");
  const context = read("components/messaging/MessagingContextPanel.tsx");
  const shell = read("components/messaging/InboxLayoutShell.tsx");
  const globals = read("app/globals.css");

  for (const token of [
    "messaging-bubble",
    "messaging-card",
    "messaging-panel",
    "messaging-composer",
    "messaging-dropdown",
    "messaging-search",
    "messaging-1",
    "messaging-2",
    "messaging-3",
    "messaging-4",
    "messaging-press",
    "messaging-hover",
    "messaging-context",
  ]) {
    assert.match(tailwind, new RegExp(`"${token}"`));
  }

  assert.match(composer, /rounded-messaging-composer/);
  assert.match(composer, /h-12 w-12/);
  assert.match(context, /rounded-messaging-panel/);
  assert.match(context, /MESSAGING_MOTION\.context/);
  assert.match(shell, /messaging-ui/);
  assert.match(globals, /\.messaging-ui svg\.lucide/);
});
