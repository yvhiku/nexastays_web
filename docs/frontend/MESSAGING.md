# Messaging frontend architecture

The messaging route is a presentation-layer workspace. It consumes the existing
conversation detail and messaging APIs; it does not define booking, payment,
review, dispute, access, or permission rules.

## Ownership

- `InboxLayoutShell` owns navigation and the conversation-list column.
- The thread route owns the single loaded `ConversationDetail`, timeline,
  composer, responsive drawers, and Context Panel.
- `deriveContextModules()` is the only lifecycle selector for contextual
  modules. It must hide unsupported data rather than invent a state.
- `contextModuleRegistry` maps a `ContextModuleId` to an independently
  renderable module. New modules register a renderer rather than changing the
  panel layout.
- The timeline renderer uses registered message and milestone renderers.
  Detailed booking context belongs in the Context Panel. Timeline milestones
  must stay compact and must never render door, lock, or access codes.

## Context priority

The selector recommends the first available module in this order: eligible
guest access, actionable payment, review, explicit dispute, near-term check-in,
booking, then support. A user's tab selection remains active until the
conversation changes or the selected module disappears.

Access is guest-only, requires an existing credential payload, and is gated
using the property's country timezone and local stay dates.

## Responsive behavior

- Desktop keeps at least 65% of the thread workspace for the conversation.
  The Context Panel is resizable from 280–400px and collapses to a compact rail.
- Tablet uses a focus-trapped side drawer.
- Mobile uses the shared bottom sheet for context and a focus-trapped
  conversation-list drawer.
- Panel width and collapsed state are local presentation preferences.

## Compatibility rules

Keep API calls, realtime reconciliation, pagination, offline queues,
attachments, voice notes, permissions, safety actions, and notification
behavior outside the presentation refactor. Unknown legacy timeline kinds must
continue to use the compact fallback renderer.

Do not show placeholder modules, disabled future features, fabricated actions,
or credentials in timeline events.

## Validation

Run:

```bash
npm test
npm run build
```

Selector tests cover lifecycle priority, missing data, credential eligibility,
payment integrity, dispute omission, and inbox grouping. The layer-policy test
also applies to messaging portals and drawers.
