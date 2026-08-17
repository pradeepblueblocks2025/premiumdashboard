import type { DashboardSectionId } from "./dashboardSections";
import { resolveAuthHeader } from "./auth";
import { withCustomerId } from "./format";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:5000";
const ENV_API_TOKEN = process.env.API_TOKEN ?? "";
const FETCH_TIMEOUT_MS = 120_000;

const SECTION_BACKEND_PATH: Record<DashboardSectionId, string> = {
  "community-users": "/api/v1/premium-dashboard/community-users",
  "volume-by-level": "/api/v1/premium-dashboard/volume-by-level",
  "purchase-stats": "/api/v1/premium-dashboard/purchase-stats",
  "financial-stats": "/api/v1/premium-dashboard/financial-stats",
  "customer-stats": "/api/v1/premium-dashboard/customer-stats",
};

function resolveToken(token?: string): string {
  const authToken =
    (token ?? "").replace(/^Bearer\s+/i, "").trim() || ENV_API_TOKEN;
  if (!authToken) {
    throw new Error(
      "No authentication token. Visit /login/{token} or set API_TOKEN in .env.local"
    );
  }
  return authToken;
}

export async function fetchDashboardSection(
  section: DashboardSectionId,
  token?: string,
  customerId?: string | null
): Promise<Record<string, unknown>> {
  const authToken = resolveToken(token);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${API_BASE_URL}${withCustomerId(SECTION_BACKEND_PATH[section], customerId)}`,
      {
        headers: { Authorization: resolveAuthHeader(authToken) },
        cache: "no-store",
        signal: controller.signal,
      }
    );

    const raw = await response.text();
    let json: { success?: boolean; data?: Record<string, unknown>; message?: string };
    try {
      json = JSON.parse(raw) as typeof json;
    } catch {
      throw new Error(
        `Section ${section} failed (${response.status}): invalid response`
      );
    }

    if (!response.ok || !json.success || !json.data) {
      throw new Error(
        json.message ||
          `Section ${section} failed (${response.status})`
      );
    }

    return json.data;
  } finally {
    clearTimeout(timeout);
  }
}
