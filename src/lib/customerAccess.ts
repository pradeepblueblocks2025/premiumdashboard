import { getApiBaseUrl } from "./apiConfig";
import { clearStoredToken, getStoredToken, resolveAuthHeader } from "./auth";

export type CustomerAccess = {
  enableDashboard: boolean;
  subscribe: boolean;
  allowed: boolean;
  profileImageUrl: string | null;
};

export function resolveCustomerImageUrl(
  path: string | null | undefined
): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = getApiBaseUrl().replace(/\/$/, "");
  const rel = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${rel}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, "");
}

function pickFlag(record: Record<string, unknown>, keys: string[]): unknown {
  const map = new Map(
    Object.entries(record).map(([key, value]) => [normalizeKey(key), value])
  );
  for (const key of keys) {
    if (map.has(normalizeKey(key))) return map.get(normalizeKey(key));
  }
  return undefined;
}

function isTrueFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

export function parseCustomerAccess(data: unknown): CustomerAccess {
  const records: Record<string, unknown>[] = [];
  const root = asRecord(data);
  if (root) {
    records.push(root);
    const nested =
      asRecord(root.customer) ??
      asRecord(root.user) ??
      asRecord(root.profile) ??
      asRecord(root.data);
    if (nested) records.push(nested);
  }

  let enableDashboard = false;
  let subscribe = false;
  let profileImage: string | null = null;

  for (const record of records) {
    const dashboardFlag = pickFlag(record, [
      "enabledashboard",
      "enable_dashboard",
      "dashboardenabled",
    ]);
    const subscribeFlag = pickFlag(record, [
      "subscribe",
      "subscribed",
      "issubscribe",
      "issubscribed",
    ]);
    const imageFlag = pickFlag(record, [
      "profileimage",
      "profile_image",
      "profilephoto",
    ]);
    if (dashboardFlag !== undefined) enableDashboard = isTrueFlag(dashboardFlag);
    if (subscribeFlag !== undefined) subscribe = isTrueFlag(subscribeFlag);
    if (typeof imageFlag === "string" && imageFlag.trim()) {
      profileImage = imageFlag.trim();
    }
  }

  return {
    enableDashboard,
    subscribe,
    allowed: enableDashboard && subscribe,
    profileImageUrl: resolveCustomerImageUrl(profileImage),
  };
}

export async function fetchCustomerAccess(): Promise<CustomerAccess> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated. Please sign in.");
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/customers/customer`,
    {
      headers: { Authorization: resolveAuthHeader(token) },
      cache: "no-store",
    }
  );

  const raw = await response.text();
  let json: {
    success?: boolean;
    data?: unknown;
    customer?: unknown;
    message?: string;
  };
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
      json.message || `Failed to load customer profile (${response.status})`
    );
  }

  const payload = json.data ?? json.customer ?? json;
  return parseCustomerAccess(payload);
}
