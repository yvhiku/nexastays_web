import type {
  ListingWizardFormState,
  WizardFieldErrors,
} from "@/lib/host-listing-wizard/form-types";

export interface StepProps {
  form: ListingWizardFormState;
  patch: (partial: Partial<ListingWizardFormState>) => void;
  /** Field errors for this step; empty until the host tried to continue. */
  errors: WizardFieldErrors;
}

/** Resolve one field error to text (or null). */
export type ErrorText = (fieldId: string) => string | null;
