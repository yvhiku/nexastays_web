import type {
  ConversationReportCategory,
  SafetyIssueCategory,
} from "@/lib/messaging/messages-api";

export const REPORT_REASON_MAX = 500;

export const REPORT_CATEGORIES: {
  id: ConversationReportCategory;
  labelKey: string;
}[] = [
  { id: "SPAM_SCAM", labelKey: "inbox.reportFlow.categories.spamScam" },
  { id: "HARASSMENT", labelKey: "inbox.reportFlow.categories.harassment" },
  {
    id: "SUSPICIOUS_ACTIVITY",
    labelKey: "inbox.reportFlow.categories.suspiciousActivity",
  },
  {
    id: "MISLEADING_INFORMATION",
    labelKey: "inbox.reportFlow.categories.misleadingInformation",
  },
  { id: "OTHER", labelKey: "inbox.reportFlow.categories.other" },
];

export const SAFETY_CATEGORIES: {
  id: SafetyIssueCategory;
  labelKey: string;
}[] = [
  { id: "FEEL_UNSAFE", labelKey: "inbox.safetyFlow.categories.feelUnsafe" },
  {
    id: "SUSPICIOUS_FRAUDULENT",
    labelKey: "inbox.safetyFlow.categories.suspiciousFraudulent",
  },
  {
    id: "PROPERTY_PROBLEM",
    labelKey: "inbox.safetyFlow.categories.propertyProblem",
  },
  {
    id: "THREATS_HARASSMENT",
    labelKey: "inbox.safetyFlow.categories.threatsHarassment",
  },
  { id: "OTHER", labelKey: "inbox.safetyFlow.categories.other" },
];

/** Always returns a reason string of length <= REPORT_REASON_MAX. */
export function formatReportReason(
  category: ConversationReportCategory,
  details?: string,
): string {
  const prefix = `[${category}]`;
  const trimmed = details?.trim() ?? "";
  if (!trimmed) return prefix.slice(0, REPORT_REASON_MAX);
  const separator = " ";
  const available = REPORT_REASON_MAX - prefix.length - separator.length;
  if (available <= 0) return prefix.slice(0, REPORT_REASON_MAX);
  return `${prefix}${separator}${trimmed.slice(0, available)}`;
}

export type SafetyBookingContext = {
  listingName?: string;
  checkIn?: string;
  checkOut?: string;
};

export function hasSafetyBookingContext(
  ctx?: SafetyBookingContext | null,
): ctx is SafetyBookingContext {
  if (!ctx) return false;
  return Boolean(ctx.listingName?.trim() || ctx.checkIn || ctx.checkOut);
}
