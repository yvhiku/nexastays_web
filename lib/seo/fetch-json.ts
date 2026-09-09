import { getStaysApiBaseUrl } from "@/lib/env";

/** Identifies our public server renderer without disabling API client protection. */
export const SEO_REQUEST_HEADERS = { "User-Agent": "NexaStaysWeb/1.0 (+https://nexastays.ma)" };

export class SeoFetchError extends Error {
  constructor(readonly status: number) {
    super(`SEO content request failed (${status || "network"})`);
    this.name = "SeoFetchError";
  }
}

/** Only an explicit API 404 means missing content. Outages must reach Next's error/ISR path. */
export async function fetchSeoJson<T>(
  path: string,
  revalidate: number,
  allowNotFound = false,
): Promise<T | null> {
  const base = getStaysApiBaseUrl().replace(/\/$/, "");
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${base}${path}`, {
        headers: SEO_REQUEST_HEADERS,
        next: { revalidate },
        signal: AbortSignal.timeout(3_000),
      });
    } catch {
      if (attempt === 0) continue;
      throw new SeoFetchError(0);
    }
    if (allowNotFound && res.status === 404) return null;
    if (!res.ok) {
      if (attempt === 0 && res.status >= 500) continue;
      throw new SeoFetchError(res.status);
    }
    return (await res.json()) as T;
  }
  throw new SeoFetchError(0);
}
