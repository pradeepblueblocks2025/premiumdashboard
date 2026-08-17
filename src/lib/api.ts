import type {
  DashboardViewModel,
  PremiumDashboardData,
  PremiumDashboardResponse,
  RankProgressItem,
} from "./types";
import { transformDashboardData } from "./transformers";
import { resolveAuthHeader } from "./auth";
import { withCustomerId } from "./format";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:5000";
const ENV_API_TOKEN = process.env.API_TOKEN ?? "";

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

async function parseApiError(response: Response): Promise<string> {
  const raw = await response.text();
  let message = raw || response.statusText;
  try {
    const json = JSON.parse(raw) as { message?: string; error?: string };
    message = json.message || json.error || message;
  } catch {
    // keep raw text
  }
  return `Dashboard API failed (${response.status}): ${message}`;
}

async function backendGet<T>(
  path: string,
  token?: string,
  customerId?: string | null
): Promise<T> {
  const authToken = resolveToken(token);
  const response = await fetch(
    `${API_BASE_URL}${withCustomerId(path, customerId)}`,
    {
      headers: {
        Authorization: resolveAuthHeader(authToken),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as PremiumDashboardResponse & {
    data: T;
  };

  if (!json.success || json.data === undefined || json.data === null) {
    throw new Error(json.message || "Failed to load dashboard data");
  }

  return json.data;
}

export async function fetchDashboardStats(
  token?: string,
  customerId?: string | null
): Promise<DashboardViewModel> {
  const authToken = resolveToken(token);
  const data = await backendGet<PremiumDashboardData>(
    "/api/v1/premium-dashboard/overview?includeRankProgress=0",
    authToken,
    customerId
  );

  return transformDashboardData(data, authToken);
}

export async function fetchRankProgress(
  token?: string,
  customerId?: string | null
): Promise<NonNullable<PremiumDashboardData["rankProgress"]>> {
  return backendGet<NonNullable<PremiumDashboardData["rankProgress"]>>(
    "/api/v1/premium-dashboard/rank-progress",
    token,
    customerId
  );
}

export async function fetchRankDetail(
  rank: string,
  token?: string,
  customerId?: string | null
): Promise<RankProgressItem> {
  const data = await backendGet<{ rank: RankProgressItem }>(
    `/api/v1/premium-dashboard/rank-progress?rank=${encodeURIComponent(rank)}`,
    token,
    customerId
  );
  return data.rank;
}

export async function fetchDashboardOverview(
  token?: string,
  customerId?: string | null
): Promise<DashboardViewModel> {
  const authToken = resolveToken(token);
  const data = await backendGet<PremiumDashboardData>(
    "/api/v1/premium-dashboard/overview",
    authToken,
    customerId
  );

  return transformDashboardData(data, authToken);
}

export function mergeRankProgress(
  viewModel: DashboardViewModel,
  rankProgress: NonNullable<PremiumDashboardData["rankProgress"]>
): DashboardViewModel {
  return {
    ...viewModel,
    rankTabs: rankProgress.ranks.map((r) => r.rank),
    rankProgress,
    rankCriteriaSummary: rankProgress.ranks.map((rank) => ({
      rank: rank.rank,
      requirement: rank.criteria,
    })),
  };
}

export function mergeRankDetail(
  rankProgress: NonNullable<PremiumDashboardData["rankProgress"]>,
  rankItem: RankProgressItem
): NonNullable<PremiumDashboardData["rankProgress"]> {
  return {
    ...rankProgress,
    ranks: rankProgress.ranks.map((rank) =>
      rank.rank === rankItem.rank ? rankItem : rank
    ),
  };
}
