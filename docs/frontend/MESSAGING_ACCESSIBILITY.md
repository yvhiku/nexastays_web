# Messaging Accessibility

Nexa Stays messaging targets WCAG 2.2 AA across English, French, and Arabic.
Accessibility is part of the component contract: visual refinements must preserve
keyboard operation, screen-reader meaning, focus behavior, reduced motion, touch
targets, and bidirectional layouts.

## Semantic structure

- The active conversation is the page's `main` landmark.
- The conversation header uses a semantic header.
- The composer is a labelled footer.
- Context content is an `aside`.
- Inbox groups are labelled sections containing semantic lists.
- Dates and message timestamps use `time` where source timestamps exist.
- Modal search and gallery surfaces expose modal-dialog semantics and trap focus.
- Context choices use the ARIA tabs pattern; action menus use the menu pattern.

Avoid adding roles to native elements when their native semantics already express the
interaction. Never attach click handlers to non-interactive containers.

## Keyboard behavior

| Surface | Keys |
| --- | --- |
| Inbox | Up/Down moves between conversations; Enter opens |
| Search | `Ctrl/Command + K` opens; Down enters results; Up/Down navigates; Enter opens; Escape closes |
| Context tabs | Left/Right moves; Home/End selects boundaries |
| Context resize | Left/Right changes width |
| Menus | Up/Down or Left/Right as appropriate; Home/End; Escape |
| Emoji picker | Four arrow keys; Home/End; Enter/Space selects; Escape |
| Gallery | Left/Right; Home/End; Escape |
| Composer | Enter sends; Shift+Enter inserts a newline |

Closing a search dialog, gallery, context drawer, emoji picker, or attachment menu
returns focus to its invoking control. New overlays must follow the same rule.

## Focus and touch

Messaging supplies a consistent high-contrast rose focus ring with a three-pixel
outline and offset. Component-specific rings may enhance it but must not remove it.
Primary icon controls and touch actions target 48 by 48 CSS pixels on touch layouts.
Desktop density may use 40-pixel controls only at large breakpoints where pointer input
is expected.

Do not use `outline: none` unless the same selector supplies a visible replacement.

## Announcements

Polite, atomic live regions announce:

- new incoming non-system messages;
- upload progress and completion;
- search-result counts;
- offline and loading states already exposed as status regions.

Announcements must be concise and must not include message bodies, access credentials,
personal contact details, or repeated high-frequency delivery updates.

## Internationalization and RTL

All control names, status messages, loading copy, and empty states use translation
keys. API-provided message and timeline content remains source content rather than UI
chrome.

Use logical CSS properties (`start`, `end`, `ms`, `me`, `ps`, `pe`) for placement.
Directional arrows mirror in RTL only when they communicate spatial navigation.
Universal symbols such as play, download, microphone, and check marks do not mirror.
Test Arabic at narrow mobile width and at 200% browser zoom.

## Motion and contrast

Framer Motion components consult `useReducedMotion`; CSS transitions include
`motion-reduce` alternatives. Reduced motion disables translation, scale, pulsing, and
decorative movement where practical.

Windows forced-colors mode receives explicit borders for interactive controls and a
system Highlight outline for focus and selected states. Unread and status information
must include text, counts, icons, or accessible names and must never depend on color
alone.

Normal text targets a 4.5:1 contrast ratio. Large text and graphical controls target
3:1. Disabled controls may be lower contrast but remain labelled and discoverable.

## Forms and errors

- Composer and search fields have accessible names in addition to placeholders.
- Upload progress uses a native progressbar role with numeric values.
- Voice position is an explicitly labelled range input with readable elapsed time.
- Blocking errors use `role="alert"`; passive loading and offline states use
  `role="status"`.
- Errors should say what failed and, when possible, identify a recovery action.

## Testing checklist

Before merging messaging changes:

1. Complete the core flow using keyboard only: open inbox, choose a conversation,
   search, open a result, attach a file, choose an emoji, send, open context, and view
   media.
2. Verify focus return after every overlay closes.
3. Inspect with NVDA or VoiceOver: landmarks, conversation names, timestamps, unread
   counts, message announcements, upload status, tabs, and dialog names.
4. Test English, French, and Arabic at desktop, tablet, and mobile widths.
5. Test 200% browser zoom and large mobile font settings without clipped copy or page
   horizontal scrolling.
6. Test `prefers-reduced-motion: reduce`, Windows forced-colors mode, and increased
   contrast.
7. Run TypeScript, messaging tests, the production build, and an axe or Lighthouse
   accessibility scan on an authenticated messaging route.

Automated checks supplement rather than replace keyboard and assistive-technology
testing. Authenticated Lighthouse or axe runs require a running Identity/Stays stack and
a valid test session; record that environment with the audit result rather than
hardcoding credentials.
