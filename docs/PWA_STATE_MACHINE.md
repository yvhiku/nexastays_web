# PWA install & guidance state machines

Launch-locked architecture for Android install and product guidance.

## Install state machine

Module: `lib/pwa-install-state.ts`

```text
IDLE
  └─ beforeinstallprompt → CAN_INSTALL
       └─ requestInstallPrompt() → PROMPTING
            ├─ userChoice.dismissed → IDLE (+ analytics install_prompt_cancelled)
            ├─ userChoice.accepted  → ACCEPTED  (wait — not installed yet)
            │    └─ appinstalled    → INSTALLED  ← sole path to Installed
            └─ prompt() throws      → FAILED
```

### Rules

- **UI never calls `markPwaInstalled()`** on `accepted` alone.
- Only the `appinstalled` listener (inside the SM) marks installed and fires `install_completed`.
- Dismiss / “Got it” without BIP → cooldown via `dismissInstallPrompt()`; phase stays non-INSTALLED.
- `accepted ≠ installed` — settings may show pending while ACCEPTED, but Installed ✓ only for INSTALLED / standalone.

### Analytics

| Event | When |
| --- | --- |
| `install_prompt_shown` | Install tip becomes active |
| `install_prompt_clicked` | User taps Install → `prompt()` |
| `install_prompt_cancelled` | `userChoice.dismissed` |
| `install_prompt_failed` | No BIP or `prompt()` error |
| `install_completed` | `appinstalled` |

### UI contract

- Dispatch **request prompt** via `requestInstallPrompt()`.
- Observe phase via `subscribeInstallPhase` / `getInstallPhase`.
- Eligibility still gated by `lib/pwa-engagement.ts` (`shouldShowInstallPrompt`, Android post-welcome, etc.).

## Guidance queue

Module: `components/guidance/ProductGuidanceProvider.tsx` + `lib/guidance-queue.ts`

```text
Event → enqueue (READY)
       → WAITING (cooldown / search open / busy)
       → SHOWING (active guide)
       → COMPLETED | SKIPPED | DISMISSED
```

### Business events

| Event | Guides |
| --- | --- |
| `home_ready` (home path) | Welcome → Search FAB (+ Install tip on Android after welcome) |
| `listing_saved` (first) | Save Celebration → Saved Spotlight |
| `booking_completed` | Trip Celebration → Trips Spotlight |
| `install_eligible` | Install tip |
| `appinstalled` / install success | Install success screen |

### Welcome retry

If cooldown blocks enqueue on first home visit, welcome **retries** until shown or already finished (`welcomeSettled` only after success).

### Analytics

| Event | When |
| --- | --- |
| `guide_queued` | Enqueued |
| `guide_shown` / `guide_viewed` | Becomes active |
| `guide_completed` | Primary / complete |
| `guide_skipped` / `guide_dismissed` | Skip / dismiss |

## DX

```js
window.NexaDebug.reset()
```

Clears guidance storage, install SM, welcome / dismiss / installed flags, then reloads — restores first-run.

## Brand assets

- Source: `public/images/nexastays.png`
- Generator: `npm run generate:pwa` → `public/icons/*` + `favicon.ico` + screenshots **412×913**
- Manifest icons: 192 / 512 any + 512 maskable
- Splash / in-app UI may still use `PWA_LOGO` (`nexastays.png`)
