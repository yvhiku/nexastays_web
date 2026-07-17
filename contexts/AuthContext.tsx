"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { refreshToken as refreshTokenApi } from "@/lib/auth-api";
import { getIdentityApiBaseUrl } from "@/lib/env";

const AUTH_TOKEN_REFRESHED = "nexa:auth:token-refreshed";
const AUTH_LOGOUT = "nexa:auth:logout";

const JWT_KEY = "nexa_access_token";
const REFRESH_TOKEN_KEY = "nexa_refresh_token";
const OTP_SESSION_KEY = "nexa_otp_session_token";

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

/** Fetch current user when we have JWT. Returns user or null; status 401 means token is invalid. */
async function fetchCurrentUser(
  baseUrl: string,
  jwt: string
): Promise<{ user: User | null; status?: number }> {
  try {
    const res = await fetch(`${baseUrl}/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!res.ok) return { user: null, status: res.status };
    const data = await res.json();
    return { user: data?.id ? data : null };
  } catch {
    return { user: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<TokenType>("none");
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const apiBase =
    typeof window !== "undefined" ? getIdentityApiBaseUrl() : "";

  const clearStoredTokens = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(JWT_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(OTP_SESSION_KEY);
    }
    setToken(null);
    setTokenType("none");
    setUser(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const jwt = localStorage.getItem(JWT_KEY);
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    const otp = localStorage.getItem(OTP_SESSION_KEY);

    async function initAuth() {
      if (jwt) {
        setToken(jwt);
        setTokenType("jwt");
        const { user: u, status } = await fetchCurrentUser(apiBase, jwt);
        if (cancelled) return;
        if (status === 401 && refresh) {
          try {
            const tokens = await refreshTokenApi(refresh);
            if (cancelled) return;
            localStorage.setItem(JWT_KEY, tokens.access_token);
            if (tokens.refresh_token) {
              localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
            }
            setToken(tokens.access_token);
            const { user: u2, status: s2 } = await fetchCurrentUser(apiBase, tokens.access_token);
            if (cancelled) return;
            if (s2 === 401) {
              clearStoredTokens();
            } else {
              setUser(u2 ?? null);
            }
          } catch {
            if (!cancelled) clearStoredTokens();
          }
        } else if (status === 401) {
          clearStoredTokens();
        } else if (u) {
          setUser(u);
        } else {
          setUser(null);
        }
      } else if (otp) {
        setToken(otp);
        setTokenType("otp_session");
        setUser(null);
      } else {
        setToken(null);
        setTokenType("none");
        setUser(null);
      }
      if (!cancelled) setReady(true);
    }
    initAuth();
    return () => { cancelled = true; };
  }, [apiBase, clearStoredTokens]);

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

  const setAuthJwt = useCallback((accessToken: string, refreshToken?: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(JWT_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      localStorage.removeItem(OTP_SESSION_KEY);
    }
    setToken(accessToken);
    setTokenType("jwt");
    setUser(null);
    fetchCurrentUser(getIdentityApiBaseUrl(), accessToken).then(({ user: u, status }) => {
      if (status === 401 && typeof window !== "undefined") {
        localStorage.removeItem(JWT_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setToken(null);
        setTokenType("none");
      } else {
        setUser(u ?? null);
      }
    });
  }, []);

  const setAuthOtpSession = useCallback((otpSessionToken: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(OTP_SESSION_KEY, otpSessionToken);
      localStorage.removeItem(JWT_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    setToken(otpSessionToken);
    setTokenType("otp_session");
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(JWT_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(OTP_SESSION_KEY);
    }
    setToken(null);
    setTokenType("none");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const jwt = tokenType === "jwt" ? token : null;
    if (!jwt) return;
    const { user: u, status } = await fetchCurrentUser(apiBase, jwt);
    if (status === 401 && typeof window !== "undefined") {
      const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refresh) {
        try {
          const tokens = await refreshTokenApi(refresh);
          localStorage.setItem(JWT_KEY, tokens.access_token);
          if (tokens.refresh_token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
          }
          setToken(tokens.access_token);
          const { user: u2 } = await fetchCurrentUser(apiBase, tokens.access_token);
          setUser(u2 ?? null);
          return;
        } catch {
          // Fall through to clear
        }
      }
      clearStoredTokens();
    } else {
      setUser(u ?? null);
    }
  }, [apiBase, token, tokenType, clearStoredTokens]);

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
