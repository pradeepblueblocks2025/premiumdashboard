import { getApiBaseUrl } from "./apiConfig";
import {
  clearStoredToken,
  getStoredToken,
  resolveAuthHeader,
} from "./auth";
import type { FirstLevelCustomer } from "./types";

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

function stringField(
  raw: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function normalizeCustomer(raw: unknown): FirstLevelCustomer | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const nested =
    item.customer && typeof item.customer === "object"
      ? (item.customer as Record<string, unknown>)
      : item;
  const customerId = stringField(
    nested,
    "customerId",
    "customerid",
    "_id",
    "id"
  );
  if (!customerId) return null;

  const first = stringField(nested, "firstname", "firstName", "first_name");
  const last = stringField(nested, "lastname", "lastName", "last_name");
  const name =
    [first, last].filter(Boolean).join(" ") ||
    stringField(nested, "name", "username", "emailAddress", "email") ||
    customerId;

  return {
    customerId,
    name,
    email: stringField(nested, "emailAddress", "email") || undefined,
    rank: stringField(nested, "rank") || undefined,
  };
}

export function extractCustomerList(data: unknown): FirstLevelCustomer[] {
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  const candidates = [
    data,
    record?.customers,
    record?.users,
    record?.firstLevelCustomers,
    record?.firstLevelUsers,
    record?.list,
    record?.items,
    record?.members,
    record?.records,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate) || candidate.length === 0) continue;
    const normalized = candidate
      .map(normalizeCustomer)
      .filter((item): item is FirstLevelCustomer => item !== null);
    if (normalized.length > 0) return normalized;
  }

  if (Array.isArray(data)) {
    return data
      .map(normalizeCustomer)
      .filter((item): item is FirstLevelCustomer => item !== null);
  }

  return [];
}

export async function fetchFirstLevelCustomers(): Promise<FirstLevelCustomer[]> {
  const token = getClientAuthToken();
  if (!token) {
    throw new Error("Not authenticated. Please sign in.");
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/premium-dashboard/first-level-customers`,
    {
      headers: { Authorization: resolveAuthHeader(token) },
      cache: "no-store",
    }
  );

  const raw = await response.text();
  let json: { success?: boolean; data?: unknown; message?: string };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error(`Invalid response from API (${response.status})`);
  }

  if (response.status === 401) {
    clearStoredToken();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok || json.success === false) {
    throw new Error(
      json.message || `Failed to load first-level customers (${response.status})`
    );
  }

  const fromData = extractCustomerList(json.data);
  if (fromData.length > 0) return fromData;
  return extractCustomerList(json);
}
