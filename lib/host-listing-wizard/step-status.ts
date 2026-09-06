/**
 * Step status derivation for the wizard shell. Pure — no React.
 * Statuses map 1:1 onto the shared `WizardStatusIcon` vocabulary.
 */
import type { ListingWizardFormState, WizardStepDef } from "./form-types";
import { validateStep } from "./validators";

export type WizardStepStatus = "ok" | "current" | "needsAttention";

export function getStepStatuses(
  steps: WizardStepDef[],
  form: ListingWizardFormState,
  currentIndex: number,
): WizardStepStatus[] {
  return steps.map((step, i) => {
    if (i === currentIndex) return "current";
    if (step.id === "submit") return "needsAttention";
    if (step.optional) return "ok";
    return validateStep(step.id, form) === null ? "ok" : "needsAttention";
  });
}

/**
 * Where to resume a hydrated draft: the first required step that still fails
 * validation. Falls back to the last step (submit) when everything is complete.
 */
export function firstIncompleteStepIndex(
  steps: WizardStepDef[],
  form: ListingWizardFormState,
): number {
  if (steps.length === 0) return 0;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.id === "submit" || step.optional) continue;
    if (validateStep(step.id, form) !== null) return i;
  }
  return steps.length - 1;
}

export type SaveStatus = "idle" | "busy" | "ok" | "error";

export interface SaveState {
  status: SaveStatus;
  /** Last successful save. */
  at?: Date;
  /** Human-readable failure (already formatted). */
  error?: string | null;
}

export type SaveEvent =
  | { type: "start" }
  | { type: "success"; at: Date }
  | { type: "failure"; error?: string | null }
  | { type: "reset" };

export function reduceSaveState(state: SaveState, event: SaveEvent): SaveState {
  switch (event.type) {
    case "start":
      return { ...state, status: "busy", error: null };
    case "success":
      return { status: "ok", at: event.at, error: null };
    case "failure":
      return { ...state, status: "error", error: event.error ?? null };
    case "reset":
      return { status: "idle" };
    default:
      return state;
  }
}
