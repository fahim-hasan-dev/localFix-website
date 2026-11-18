const ACCESS_TOKEN_KEY = "lhf-access-token";
const REFRESH_TOKEN_KEY = "lhf-refresh-token";
const USER_ROLE_KEY = "lhf-auth-role";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getCookie(name: string): string | null {
  if (!isBrowser() || !document.cookie) return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 30): void {
  if (!isBrowser()) return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (!isBrowser()) return;
  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function normalizeRole(role?: string | null): "homeowner" | "pro" {
  if (!role) return "homeowner";
  const value = String(role).trim().toLowerCase();
  if (value === "professional" || value === "pro" || value === "contractor") return "pro";
  return "homeowner";
}

export function toBackendRole(role?: string | null): "home_owner" | "professional" {
  const value = String(role || "").trim().toLowerCase();
  if (value === "pro" || value === "professional" || value === "contractor") return "professional";
  return "home_owner";
}

export const authToken = {
  getAccessToken(): string | null {
    if (!isBrowser()) return null;
    return getCookie(ACCESS_TOKEN_KEY) || window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (!isBrowser()) return null;
    return getCookie(REFRESH_TOKEN_KEY) || window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getRole(): "homeowner" | "pro" | null {
    if (!isBrowser()) return null;
    const raw = getCookie(USER_ROLE_KEY) || window.localStorage.getItem(USER_ROLE_KEY);
    return raw ? normalizeRole(raw) : null;
  },

  setTokens(tokens: { accessToken: string; refreshToken?: string; role?: string }): void {
    if (!isBrowser()) return;
    setCookie(ACCESS_TOKEN_KEY, tokens.accessToken);
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);

    if (tokens.refreshToken) {
      setCookie(REFRESH_TOKEN_KEY, tokens.refreshToken);
      window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
    if (tokens.role) {
      const normalized = normalizeRole(tokens.role);
      setCookie(USER_ROLE_KEY, normalized);
      window.localStorage.setItem(USER_ROLE_KEY, normalized);
    }
  },

  clearTokens(): void {
    if (!isBrowser()) return;
    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
    deleteCookie(USER_ROLE_KEY);
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(USER_ROLE_KEY);
  },
};
