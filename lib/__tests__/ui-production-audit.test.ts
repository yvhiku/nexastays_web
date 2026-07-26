import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("global interaction styles preserve focus and reduced-motion accessibility", () => {
  const css = read("app/globals.css");

  assert.match(css, /:focus-visible[\s\S]*outline: 3px solid/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation-duration: 0\.01ms !important/);
  assert.match(css, /transition-duration: 0\.01ms !important/);
});

test("production modal behavior traps focus, restores focus, locks scroll, and closes on Escape", () => {
  const behavior = read("components/ui/useModalDialog.ts");

  assert.match(behavior, /useFocusTrap\(active, containerRef\)/);
  assert.match(behavior, /document\.body\.style\.overflow = "hidden"/);
  assert.match(behavior, /event\.key === "Escape"/);
  assert.match(behavior, /document\.body\.style\.overflow = previousOverflow/);
});

test("critical booking and review dialogs use the shared modal behavior", () => {
  for (const path of [
    "components/bookings/CancelBookingDialog.tsx",
    "components/booking/GuestVerificationStep.tsx",
    "components/reviews/ReviewModal.tsx",
    "components/saved/SavedOnboardingSheet.tsx",
    "app/[locale]/my-bookings/page.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /useModalDialog\(/, `${path} must use modal behavior`);
    assert.match(source, /ref=\{dialogRef\}/, `${path} must bind the dialog ref`);
  }
});
