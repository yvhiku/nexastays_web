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
  [key: string]: unknown;
}

interface AuthContextValue {
  token: string | null;
  tokenType: TokenType;
  user: User | null;
  ready: boolean;
  isAuthenticated: boolean;
  /** Set JWT after login or registration complete (refreshToken optional, for persistent sessions) */
  setAuthJwt: (accessToken: string, refreshToken?: string) => void;
  /** Set OTP session token for registration flow */
  setAuthOtpSession: (otpSessionToken: string) => void;
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
  const [ready, setReady] = useState(false);

  const clearStoredTokens = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(OTP_SESSION_KEY);
    }
    setToken(null);
    setTokenType("none");
    setUser(null);
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
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [clearStoredTokens]);

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

  const setAuthJwt = useCallback((accessToken: string, _refreshToken?: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(OTP_SESSION_KEY);
    }
    setToken(accessToken);
    setTokenType("jwt");
    setUser(null);
    fetchCurrentUserWithJwt(accessToken).then(({ user: u, status }) => {
      if (status === 401 && typeof window !== "undefined") {
        setToken(null);
        setTokenType("none");
      } else {
        setUser(u ?? null);
      }
    });
    broadcastAuth("session");
  }, []);

  const setAuthOtpSession = useCallback((otpSessionToken: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(OTP_SESSION_KEY, otpSessionToken);
    }
    setToken(otpSessionToken);
    setTokenType("otp_session");
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    void logoutBrowserSession().catch(() => {
      // Local sign-out must still complete if the session already expired.
    });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(OTP_SESSION_KEY);
    }
    setToken(null);
    setTokenType("none");
    setUser(null);
    broadcastAuth("logout");
    void import("@/lib/pwa-sw-update").then((module) =>
      module.clearSensitiveRuntimeCaches(),
    );
  }, []);

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
        return;
      } catch {
        // Fall through to clear
      }
      clearStoredTokens();
    } else {
      setUser(u ?? null);
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
    ready,
    isAuthenticated: tokenType === "jwt" && !!token,
    setAuthJwt,
    setAuthOtpSession,
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
