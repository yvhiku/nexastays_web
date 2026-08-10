"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  logoutBrowserSession,
  refreshToken as refreshTokenApi,
} from "@/lib/auth-api";
import { hydrateAuthSession, fetchCurrentUserWithJwt } from "@/lib/auth-session";
import {
  clearMemoryAccessToken,
  setMemoryAccessToken,
} from "@/lib/access-token-store";
import { clearRegistrationPhone } from "@/lib/registration-phone-store";
import type { IdentityOnboardingState } from "@/lib/auth-api";

const AUTH_TOKEN_REFRESHED = "nexa:auth:token-refreshed";
const AUTH_LOGOUT = "nexa:auth:logout";

const OTP_SESSION_KEY = "nexa_otp_session_token";
const AUTH_CHANNEL = "nexa-auth";

function broadcastAuth(type: "session" | "logout"): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage({ type });
  channel.close();
}

export type TokenType = "jwt" | "otp_session" | "none";

export interface User {
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
}

interface AuthContextValue {
  token: string | null;
  tokenType: TokenType;
  user: User | null;
  onboarding: IdentityOnboardingState | null;
  ready: boolean;
  isAuthenticated: boolean;
  /** Set JWT after login or registration complete (refreshToken optional, for persistent sessions) */
  setAuthJwt: (
    accessToken: string,
    refreshToken?: string,
    onboarding?: IdentityOnboardingState,
  ) => void;
  /** Set OTP session token for registration flow */
  setAuthOtpSession: (
    otpSessionToken: string,
    onboarding?: IdentityOnboardingState,
  ) => void;
  setOnboarding: (onboarding: IdentityOnboardingState | null) => void;
  /** Refresh user from API (e.g. after profile/photo update) */
  refreshUser: () => Promise<void>;
  logout: () => void;
  /** For backward compat during migration */
  userId: string | null;
  setAuth: (token: string, userId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<TokenType>("none");
  const [user, setUser] = useState<User | null>(null);
  const [onboarding, setOnboarding] =
    useState<IdentityOnboardingState | null>(null);
  const [ready, setReady] = useState(false);

  const clearStoredTokens = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(OTP_SESSION_KEY);
    }
    clearMemoryAccessToken();
    clearRegistrationPhone();
    setToken(null);
    setTokenType("none");
    setUser(null);
    setOnboarding(null);
    void import("@/lib/pwa-sw-update").then((module) =>
      module.clearSensitiveRuntimeCaches(),
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    void import("@/lib/pwa-sw-update").then((module) =>
      module.clearSensitiveRuntimeCaches(),
    );
    const otp = sessionStorage.getItem(OTP_SESSION_KEY);

    if (otp) {
      setToken(otp);
      setTokenType("otp_session");
      setUser(null);
      setOnboarding(null);
      setReady(true);
      return () => {
        cancelled = true;
      };
    }

    // Restore using the HttpOnly refresh cookie. Access tokens stay in memory.
    setReady(false);
    setToken(null);
    setTokenType("none");
    setUser(null);
    setOnboarding(null);
    void (async () => {
      const result = await hydrateAuthSession();
      if (cancelled) return;
      if (result.cleared || !result.accessToken) {
        if (result.cleared) clearStoredTokens();
        setReady(true);
        return;
      }
      setToken(result.accessToken);
      setTokenType("jwt");
      setUser(result.user);
      setOnboarding(result.user?.onboarding ?? null);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [clearStoredTokens]);

  // Keep module-level store in sync for axios clients (PROD-SEC-001 Bearer).
  useEffect(() => {
    if (tokenType === "jwt" && token) {
      setMemoryAccessToken(token);
    } else if (tokenType !== "jwt") {
      // OTP session tokens are not JWTs for Stays Bearer auth.
      if (tokenType === "none") clearMemoryAccessToken();
    }
  }, [token, tokenType]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "logout") {
        clearStoredTokens();
        return;
      }
      if (event.data?.type === "session") {
        void hydrateAuthSession().then((result) => {
          if (!result.accessToken) return;
          setToken(result.accessToken);
          setTokenType("jwt");
          setUser(result.user);
          setOnboarding(result.user?.onboarding ?? null);
        });
      }
    };
    return () => channel.close();
  }, [clearStoredTokens]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onTokenRefreshed = (e: Event) => {
      const detail = (e as CustomEvent<{ accessToken: string }>).detail;
      if (detail?.accessToken) {
        setToken(detail.accessToken);
      }
    };
    const onLogout = () => {
      clearStoredTokens();
    };
    window.addEventListener(AUTH_TOKEN_REFRESHED, onTokenRefreshed);
    window.addEventListener(AUTH_LOGOUT, onLogout);
    return () => {
      window.removeEventListener(AUTH_TOKEN_REFRESHED, onTokenRefreshed);
      window.removeEventListener(AUTH_LOGOUT, onLogout);
    };
  }, [clearStoredTokens]);

  const setAuthJwt = useCallback((
    accessToken: string,
    _refreshToken?: string,
    nextOnboarding?: IdentityOnboardingState,
  ) => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(OTP_SESSION_KEY);
    }
    clearRegistrationPhone();
    setMemoryAccessToken(accessToken);
    setToken(accessToken);
    setTokenType("jwt");
    setUser(null);
    if (nextOnboarding) setOnboarding(nextOnboarding);
    fetchCurrentUserWithJwt(accessToken).then(({ user: u, status }) => {
      if (status === 401 && typeof window !== "undefined") {
        clearMemoryAccessToken();
        setToken(null);
        setTokenType("none");
        setOnboarding(null);
      } else {
        setUser(u ?? null);
        if (u?.onboarding) setOnboarding(u.onboarding);
      }
    });
    broadcastAuth("session");
  }, []);

  const setAuthOtpSession = useCallback((
    otpSessionToken: string,
    nextOnboarding?: IdentityOnboardingState,
  ) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(OTP_SESSION_KEY, otpSessionToken);
    }
    setToken(otpSessionToken);
    setTokenType("otp_session");
    setUser(null);
    setOnboarding(nextOnboarding ?? null);
  }, []);

  const logout = useCallback(() => {
    const access = tokenType === "jwt" ? token : null;
    // HttpOnly refresh cookie is still sent with credentials until the server clears it.
    void logoutBrowserSession(access).catch(() => {
      // Local sign-out must still complete if the session already expired.
    });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(OTP_SESSION_KEY);
    }
    clearMemoryAccessToken();
    clearRegistrationPhone();
    setToken(null);
    setTokenType("none");
    setUser(null);
    setOnboarding(null);
    broadcastAuth("logout");
    void import("@/lib/pwa-sw-update").then((module) =>
      module.clearSensitiveRuntimeCaches(),
    );
  }, [token, tokenType]);

  const refreshUser = useCallback(async () => {
    const jwt = tokenType === "jwt" ? token : null;
    if (!jwt) return;
    const { user: u, status } = await fetchCurrentUserWithJwt(jwt);
    if (status === 401 && typeof window !== "undefined") {
      try {
        const tokens = await refreshTokenApi();
        setToken(tokens.access_token);
        const { user: u2 } = await fetchCurrentUserWithJwt(tokens.access_token);
        setUser(u2 ?? null);
        setOnboarding(u2?.onboarding ?? null);
        return;
      } catch {
        // Fall through to clear
      }
      clearStoredTokens();
    } else {
      setUser(u ?? null);
      setOnboarding(u?.onboarding ?? null);
    }
  }, [token, tokenType, clearStoredTokens]);

  /** Legacy: treats token as JWT if userId looks like UUID, else OTP session */
  const setAuth = useCallback((t: string, userId: string) => {
    const looksLikeUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        userId
      );
    if (looksLikeUuid) {
      setAuthJwt(t);
    } else {
      setAuthOtpSession(t);
    }
  }, [setAuthJwt, setAuthOtpSession]);

  const value: AuthContextValue = {
    token,
    tokenType,
    user,
    onboarding,
    ready,
    isAuthenticated:
      tokenType === "jwt" && !!token && onboarding?.required !== true,
    setAuthJwt,
    setAuthOtpSession,
    setOnboarding,
    refreshUser,
    logout,
    userId: user?.id ?? null,
    setAuth,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
