export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\u0000-\u001f\\]/.test(value)) return null;
  try {
    const parsed = new URL(value, "https://nexa.invalid");
    if (parsed.origin !== "https://nexa.invalid") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function safeExternalHttpUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!["https:", "http:"].includes(parsed.protocol)) return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function safeTelephoneUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const number = value.startsWith("tel:") ? value.slice(4) : value;
  if (!/^\+?[\d\s().-]{3,30}$/.test(number)) return null;
  return `tel:${number}`;
}

export function safeEmailUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const address = value.startsWith("mailto:") ? value.slice(7) : value;
  if (!/^[^\s@/?#]+@[^\s@/?#]+\.[^\s@/?#]+$/.test(address)) return null;
  return `mailto:${address}`;
}
