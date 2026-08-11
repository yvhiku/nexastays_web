import { refreshToken as refreshTokenApi } from "@/lib/auth-api";
import { getIdentityApiBaseUrl } from "@/lib/env";
import type { IdentityOnboardingState } from "@/lib/auth-api";

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
  onboarding?: IdentityOnboardingState;
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
      credentials: "include",
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!res.ok) return { user: null, status: res.status };
    const data = await res.json();
    return { user: data?.id ? (data as AuthUser) : null };
  } catch {
    return { user: null };
  }
}

/**
 * Restore a browser session from the rotating HttpOnly refresh cookie.
 * Dedupes concurrent calls (React Strict Mode).
 */
export async function hydrateAuthSession(): Promise<HydrateAuthResult> {
  if (typeof window === "undefined") {
    return { accessToken: null, user: null, cleared: false };
  }
  if (hydrateInflight) return hydrateInflight;

  hydrateInflight = (async (): Promise<HydrateAuthResult> => {
    try {
      const tokens = await refreshTokenApi();
      const current = await fetchCurrentUser(
        getIdentityApiBaseUrl(),
        tokens.access_token,
      );
      if (current.status === 401) {
        return { accessToken: null, user: null, cleared: true };
      }
      return {
        accessToken: tokens.access_token,
        user: current.user,
        cleared: false,
      };
    } catch {
      return { accessToken: null, user: null, cleared: true };
    }
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
  return fetchCurrentUser(getIdentityApiBaseUrl(), jwt);
}
