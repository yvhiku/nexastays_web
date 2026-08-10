import type { AxiosInstance } from "axios";
import {
  getMemoryAccessToken,
  setMemoryAccessToken,
} from "./access-token-store";
import {
  notifyAuthLogout,
  notifyTokenRefreshed,
  refreshToken as refreshTokenApi,
} from "./auth-api";

/**
 * Attach in-memory Bearer + cookie refresh retry (PROD-SEC-001 / ADR-005).
 * withCredentials remains for refresh/logout cookies only.
 */
export function attachBrowserBearerAuth(client: AxiosInstance): void {
  client.interceptors.request.use((config) => {
    const token = getMemoryAccessToken();
    if (token) {
      const headers = config.headers ?? {};
      const existing =
        (headers as { Authorization?: string }).Authorization ||
        (headers as { authorization?: string }).authorization;
      if (!existing) {
        (headers as { Authorization?: string }).Authorization = `Bearer ${token}`;
        config.headers = headers as typeof config.headers;
      }
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (err) => {
      const config = err.config as
        | (typeof err.config & { __refreshRetried?: boolean })
        | undefined;
      if (!config) return Promise.reject(err);
      if (
        err.response?.status === 401 &&
        !config.__refreshRetried &&
        typeof window !== "undefined"
      ) {
        const hadAuth =
          config.headers?.["Authorization"] ||
          config.headers?.Authorization ||
          getMemoryAccessToken();
        if (hadAuth) {
          config.__refreshRetried = true;
          try {
            const tokens = await refreshTokenApi();
            setMemoryAccessToken(tokens.access_token);
            notifyTokenRefreshed(tokens.access_token);
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${tokens.access_token}`,
            };
            return client.request(config);
          } catch {
            notifyAuthLogout();
          }
        }
      }
      return Promise.reject(err);
    },
  );
}
