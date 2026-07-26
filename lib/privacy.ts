export function maskSensitiveIdentifier(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  const visible = normalized.slice(-4);
  return `${"•".repeat(Math.max(4, Math.min(8, normalized.length - visible.length)))}${visible}`;
}
