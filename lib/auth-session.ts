import { refreshToken as refreshTokenApi } from "@/lib/auth-api";
import { getIdentityApiBaseUrl } from "@/lib/env";
import { isJwtExpired } from "@/lib/jwt-utils";

const JWT_KEY = "nexa_access_token";
const REFRESH_TOKEN_KEY = "nexa_refresh_token";

export type AuthUser = {
  id: string;
  phone_number?: string;
  full_name?: string;
  email?: string;
  kyc_status?: string;
  account_type?: string;
  profile_photo_url?: string | null;
  city?: string;
  date_of_birth?: string;
  nationality?: string;
  [key: string]: unknown;
};

export type HydrateAuthResult = {
  accessToken: string | null;
  user: AuthUser | null;
  cleared: boolean;
};

let hydrateInflight: Promise<HydrateAuthResult> | null = null;

async function fetchCurrentUser(
  baseUrl: string,
  jwt: string,
): Promise<{ user: AuthUser | null; status?: number }> {
  try {
    const res = await fetch(`${baseUrl}/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!res.ok) return { user: null, status: res.status };
    const data = await res.json();
    return { user: data?.id ? (data as AuthUser) : null };
  } catch {
    return { user: null };
  }
}

function clearStoredTokens(): void {
  localStorage.removeItem(JWT_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Restore session from localStorage with at most one GET /users/me.
 * Skips /users/me when the access token is expired (refresh or clear first).
 * Dedupes concurrent calls (React Strict Mode).
 */
export async function hydrateAuthSession(): Promise<HydrateAuthResult> {
  if (typeof window === "undefined") {
    return { accessToken: null, user: null, cleared: false };
  }
  if (hydrateInflight) return hydrateInflight;

  hydrateInflight = (async (): Promise<HydrateAuthResult> => {
    const jwt = localStorage.getItem(JWT_KEY);
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!jwt) {
      return { accessToken: null, user: null, cleared: false };
    }

    let accessToken = jwt;

    if (isJwtExpired(jwt)) {
      if (!refresh) {
        clearStoredTokens();
        return { accessToken: null, user: null, cleared: true };
      }
      try {
        const tokens = await refreshTokenApi(refresh);
        accessToken = tokens.access_token;
        localStorage.setItem(JWT_KEY, tokens.access_token);
        if (tokens.refresh_token) {
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
        }
      } catch {
        clearStoredTokens();
        return { accessToken: null, user: null, cleared: true };
      }
    }

    const { user, status } = await fetchCurrentUser(getIdentityApiBaseUrl(), accessToken);
    if (status === 401) {
      if (refresh && accessToken === jwt) {
        try {
          const tokens = await refreshTokenApi(refresh);
          localStorage.setItem(JWT_KEY, tokens.access_token);
          if (tokens.refresh_token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
          }
          const retry = await fetchCurrentUser(
            getIdentityApiBaseUrl(),
            tokens.access_token,
          );
          if (retry.status === 401) {
            clearStoredTokens();
            return { accessToken: null, user: null, cleared: true };
          }
          return {
            accessToken: tokens.access_token,
            user: retry.user,
            cleared: false,
          };
        } catch {
          clearStoredTokens();
          return { accessToken: null, user: null, cleared: true };
        }
      }
      clearStoredTokens();
      return { accessToken: null, user: null, cleared: true };
    }

    return { accessToken, user, cleared: false };
  })();

  try {
    return await hydrateInflight;
  } finally {
    hydrateInflight = null;
  }
}

/** Fetch user for explicit login / profile refresh (not startup hydration). */
export async function fetchCurrentUserWithJwt(
  jwt: string,
): Promise<{ user: AuthUser | null; status?: number }> {
  if (isJwtExpired(jwt)) {
    return { user: null, status: 401 };
  }
  return fetchCurrentUser(getIdentityApiBaseUrl(), jwt);
}
