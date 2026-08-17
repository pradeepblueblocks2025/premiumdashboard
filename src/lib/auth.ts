const TOKEN_STORAGE_KEY = "dashboard_api_token";
export const AUTH_CHANGED_EVENT = "dashboard-auth-changed";

function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  const normalized = token.replace(/^Bearer\s+/i, "").trim();
  if (normalized) {
    localStorage.setItem(TOKEN_STORAGE_KEY, normalized);
    notifyAuthChanged();
  }
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  notifyAuthChanged();
}

export function toBearerToken(token: string): string {
  const normalized = token.replace(/^Bearer\s+/i, "").trim();
  return normalized ? `Bearer ${normalized}` : "";
}

export function resolveAuthHeader(token?: string | null): string {
  const normalized = (token ?? "").replace(/^Bearer\s+/i, "").trim();
  return normalized ? `Bearer ${normalized}` : "";
}
