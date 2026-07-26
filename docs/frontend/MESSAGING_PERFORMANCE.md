# Messaging Performance

## Performance goals

Nexa Stays messaging must remain responsive during long sessions and in media-heavy
conversations. The frontend targets smooth 60 FPS interaction, prompt composer input,
stable scroll anchoring, and bounded DOM and media memory. Messaging APIs, permissions,
delivery semantics, and booking rules are outside this optimization layer.

## Timeline rendering

The thread continues to use the existing cursor-based incremental history endpoint.
Only the newest page is loaded initially; older pages are requested as the user reaches
the top, and the existing scroll-anchor hook preserves the visible position.

Once a loaded timeline exceeds 80 presentation rows, `TimelineRenderer` uses
`@tanstack/react-virtual` with:

- variable-height element measurement;
- stable message IDs as virtual item keys;
- eight rows of overscan;
- conservative type-specific size estimates;
- the existing thread scroll element;
- a message-ID navigation event for search and conversation anchors.

Short timelines retain normal document flow. This avoids virtualization overhead in
the common case while bounding DOM size for large loaded histories.

## Memoization and state boundaries

Timeline presentation, message grouping, context-module derivation, inbox grouping,
media categorization, and search lookup maps are memoized at their current ownership
boundaries. Context modules mount only for the selected tab. Composer draft state stays
local and does not invalidate the whole inbox.

Keys must come from persisted message, attachment, conversation, or module IDs. Index
keys are permitted only for fixed decorative skeletons that never reorder.

## Lazy loading and code splitting

- Full-screen media, context panels, and other optional workspaces use Next.js dynamic
  imports from the thread route.
- Images use native lazy loading, asynchronous decoding, intersection-based activation,
  shimmer placeholders, and opacity-only reveals.
- The full-screen viewer preloads only the immediately adjacent images and releases
  those preload references when navigation changes.
- Signed media URLs and existing download endpoints remain authoritative.

## Search

Conversation search retains the 200 ms debounce. Results are cached in a bounded
in-memory map for the latest 30 conversation/query pairs. Cached results never persist
across reloads and contain no additional data beyond the existing search response.

## Resizing and scrolling

Context width is updated during pointer movement but persisted only on pointer release.
Virtual measurements and scroll anchoring avoid synchronous layout-read/write loops.
All observers, global listeners, timers, and image preload references must be removed
in effect cleanup.

## Development instrumentation

`lib/messaging/performance.ts` provides development-only console timing. It does not
emit analytics or network requests. Current measurements include conversation search;
future measurements should use the same helper and must not include message content,
credentials, or personal data.

## Budgets

- Keep the critical inbox/thread path free of media-gallery and search implementation
  code until those surfaces open.
- Keep virtual overscan at 8 rows unless profiling demonstrates a visible gap.
- Do not preload more than the two adjacent gallery images.
- Avoid animations of width, height, inset, or other layout properties while scrolling.
- Prefer `transform` and `opacity`; honor `prefers-reduced-motion`.
- Do not introduce unbounded client caches.

## Known limitations

Virtualization bounds the DOM for messages already loaded by the paginated API; it does
not fetch unseen history or change server pagination. Search can navigate directly to
loaded virtual rows. Results outside loaded history continue to follow the existing
server-search and history-loading behavior. Exact download byte progress is not exposed
by the current download helper, so the UI uses an honest indeterminate progress state.

## Contributor checklist

Before merging messaging changes:

1. Test short and 100+ row conversations.
2. Verify older-history scroll anchoring and realtime append behavior.
3. Verify optimistic reconciliation does not remount persisted messages.
4. Verify search, gallery, context switching, keyboard navigation, and reduced motion.
5. Run TypeScript, messaging tests, the production build, and the layering/responsive
   policy tests.
