/** Normalize inbox preview copy for role-specific system cards (legacy API fallback). */
export function resolveRoleAwareInboxPreview(
  preview: string | null | undefined,
  viewerRole?: "guest" | "host",
): string {
  const trimmed = preview?.trim() ?? "";
  if (!trimmed || viewerRole !== "host") return trimmed || "—";

  switch (trimmed) {
    case "Review your stay":
      return "Review request sent";
    case "Thanks for reviewing!":
    case "Thanks for reviewing":
      return "Guest reviewed successfully";
    default:
      return trimmed;
  }
}
