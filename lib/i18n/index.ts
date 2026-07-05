/**
 * i18n — Language selection: English, French, Arabic. Missing translations fall back to English.
 */

export type Locale = "en" | "fr" | "ar";

export const LOCALES: { code: Locale; name: string; native: string; rtl?: boolean }[] = [
  { code: "en", name: "English", native: "English" },
  { code: "fr", name: "French", native: "Français" },
  { code: "ar", name: "Arabic", native: "العربية", rtl: true },
];

export const DEFAULT_LOCALE: Locale = "en";

export const STORAGE_KEY = "nexa_locale";

export type Translations = Record<string, string | Record<string, string | Record<string, string>>>;

function getNested(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const p of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return typeof current === "string" ? current : undefined;
}

/** Replace {em}...{/em} with <em>...</em> and \n with <br /> for rich text */
export function formatMessage(
  msg: string,
  vars?: Record<string, string | number>
): string {
  let s = msg;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  s = s.replace(/\{em\}(.*?)\{\/em\}/g, "<em>$1</em>");
  s = s.replace(/\n/g, "<br />");
  return s;
}

/** Recursively get translation by dot path (e.g. "common.signIn") */
export function t(translations: Translations | null, key: string): string {
  if (!translations) return key;
  const val = getNested(translations, key);
  return val ?? key;
}
