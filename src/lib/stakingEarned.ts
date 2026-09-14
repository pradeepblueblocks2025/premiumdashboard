import { fetchBackendJson } from "./clientApi";
import { withCustomerId } from "./format";

const DOWNLINE_STAKING_EARNED_PATH =
  "/api/v1/premium-dashboard/downline-staking-earned";

export type StakingPeriodSummary = {
  totalMtht: number;
  totalUsdt: number;
  count: number;
};

export type StakingEarnedData = {
  today: StakingPeriodSummary;
  yesterday: StakingPeriodSummary;
  week: StakingPeriodSummary;
  month: StakingPeriodSummary;
};

const EMPTY_PERIOD: StakingPeriodSummary = {
  totalMtht: 0,
  totalUsdt: 0,
  count: 0,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function numberField(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function normalizePeriod(value: unknown): StakingPeriodSummary {
  const record = asRecord(value);
  if (!record) return EMPTY_PERIOD;

  return {
    totalMtht: numberField(record, "totalStaking", "totalMtht", "mtht"),
    totalUsdt: numberField(
      record,
      "totalStakingUsd",
      "totalUsdt",
      "totalUsd",
      "usdt"
    ),
    count: numberField(record, "count"),
  };
}

export function normalizeStakingEarned(payload: unknown): StakingEarnedData {
  const record = asRecord(payload) ?? {};
  return {
    today: normalizePeriod(record.today),
    yesterday: normalizePeriod(record.yesterday),
    week: normalizePeriod(record["7days"] ?? record.week),
    month: normalizePeriod(record.month),
  };
}

export function stakingEarnedPath(
  customerId?: string | null,
  period = "7days"
): string {
  return withCustomerId(
    `${DOWNLINE_STAKING_EARNED_PATH}?period=${encodeURIComponent(period)}`,
    customerId
  );
}

export async function fetchDownlineStakingEarned(
  customerId?: string | null,
  period = "7days"
): Promise<StakingEarnedData> {
  const payload = await fetchBackendJson<unknown>(
    stakingEarnedPath(customerId, period)
  );
  return normalizeStakingEarned(payload);
}
