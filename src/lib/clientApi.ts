import { getApiBaseUrl } from "./apiConfig";
import {
  clearStoredToken,
  getStoredToken,
  resolveAuthHeader,
} from "./auth";

export function getClientAuthToken(): string {
  return getStoredToken() || "";
}

const DEFAULT_FETCH_TIMEOUT_MS = 90_000;

export async function fetchBackendJson<T>(
  path: string,
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS
): Promise<T> {
  const token = getClientAuthToken();
  if (!token) {
    throw new Error("Not authenticated. Please sign in.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: {
        Authorization: resolveAuthHeader(token),
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s. Try again shortly.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const raw = await response.text();
  let json: { success?: boolean; data?: T; message?: string };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error(`Invalid response from API (${response.status})`);
  }

  if (response.status === 401) {
    clearStoredToken();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok || !json.success || json.data === undefined) {
    throw new Error(json.message || `API request failed (${response.status})`);
  }

  return json.data;
}
