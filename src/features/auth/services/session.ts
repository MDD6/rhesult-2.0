import type { LoginResponse } from "./authApi";

const TOKEN_KEY = "rhesult_token";
const USER_KEY = "rhesult_user";

function setTokenCookie(token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

function clearTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function saveSession(data: LoginResponse) {
  if (typeof window === "undefined") return;

  const token = data.token || data.access_token || data.accessToken;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setTokenCookie(token);
  }

  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
}

export function getSessionToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearTokenCookie();
  void fetch("/api/auth/logout", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}
