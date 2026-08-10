/**
 * In-memory web access JWT (ADR-005 / PROD-SEC-001).
 * Never persisted to web storage. Refresh uses HttpOnly nexa_refresh only.
 */

let memoryAccessToken: string | null = null;

export function getMemoryAccessToken(): string | null {
  return memoryAccessToken;
}

export function setMemoryAccessToken(token: string | null): void {
  memoryAccessToken = token && token.length > 0 ? token : null;
}

export function clearMemoryAccessToken(): void {
  memoryAccessToken = null;
}

/** Axios/fetch Authorization header from memory when present. */
export function bearerAuthHeaders(): Record<string, string> {
  const token = getMemoryAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
