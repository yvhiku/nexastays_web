export const NEXA_CONTACT_EMAIL = "contact@nexastays.ma";
export const NEXA_SUPPORT_EMAIL = "support@nexastays.ma";
export const NEXA_PARTNERSHIPS_EMAIL = "partnerships@nexastays.ma";

export const NEXA_CONTACT_EMAILS = [
  { email: NEXA_CONTACT_EMAIL, labelKey: "footer.emailContact" as const },
  { email: NEXA_SUPPORT_EMAIL, labelKey: "footer.emailSupport" as const },
  { email: NEXA_PARTNERSHIPS_EMAIL, labelKey: "footer.emailPartnerships" as const },
] as const;

export function contactEmailForReason(reason: string): string {
  if (reason === "Support") return NEXA_SUPPORT_EMAIL;
  if (reason === "Partnership (10+ units)" || reason === "Investments") {
    return NEXA_PARTNERSHIPS_EMAIL;
  }
  return NEXA_CONTACT_EMAIL;
}
