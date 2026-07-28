/** Strip replacement chars and control bytes from API/user text before render. */
export function cleanText(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/\uFFFD/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();
}
