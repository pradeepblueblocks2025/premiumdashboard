import { fetchBackendJson } from "./clientApi";
import { formatPointLabel } from "./liveBusiness";
import { withCustomerId } from "./format";
import type { LiveBusinessData, LiveBusinessPoint, LiveBusinessRange } from "./types";

const AFFILIATE_EARNED_PATH =
  "/api/v1/premium-dashboard/downline-affiliate-earned";

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

function stringField(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  return typeof value === "string" ? value : "";
}

function chartArray(record: Record<string, unknown>): unknown[] {
  for (const key of ["chart", "series", "daily", "points", "graph"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizePoint(item: unknown, index: number): LiveBusinessPoint | null {
  const record = asRecord(item);
  if (!record) return null;

  const date = stringField(record, "date") || `Point ${index + 1}`;
  return {
    date,
    label: formatPointLabel(date),
    mtht: numberField(
      record,
      "totalMtht",
      "mtht",
      "earnedMtht",
      "totalAffiliateRewards",
      "earned",
      "amount"
    ),
    usdt: numberField(
      record,
      "totalUsdt",
      "totalUsd",
      "usdt",
      "usd",
      "totalAffiliateRewardsUsd",
      "earnedUsdt"
    ),
    nftPurchased: numberField(
      record,
      "totalAffiliates",
      "affiliateCount",
      "count",
      "totalCount",
      "totalNftPurchased",
      "nftPurchased"
    ),
  };
}

export function normalizeAffiliateEarned(payload: unknown): LiveBusinessData {
  const record = asRecord(payload) ?? {};

  return {
    range: stringField(record, "range") || undefined,
    summary: {
      range: stringField(record, "range") || undefined,
      startDate: stringField(record, "startDate") || undefined,
      endDate: stringField(record, "endDate") || undefined,
      totalMtht: numberField(
        record,
        "totalMtht",
        "earnedMtht",
        "totalAffiliateRewards",
        "earned",
        "amount"
      ),
      totalUsdt: numberField(
        record,
        "totalUsdt",
        "totalUsd",
        "totalAffiliateRewardsUsd",
        "earnedUsdt",
        "usdt",
        "usd"
      ),
      totalNftPurchased: numberField(
        record,
        "totalAffiliates",
        "affiliateCount",
        "count",
        "totalCount",
        "totalNftPurchased"
      ),
    },
    series: chartArray(record)
      .map(normalizePoint)
      .filter((point): point is LiveBusinessPoint => point !== null),
  };
}

export function affiliateEarnedPath(
  range?: LiveBusinessRange,
  customerId?: string | null
): string {
  const path = range
    ? `${AFFILIATE_EARNED_PATH}?range=${encodeURIComponent(range)}`
    : AFFILIATE_EARNED_PATH;
  return withCustomerId(path, customerId);
}

export async function fetchAffiliateEarned(
  range?: LiveBusinessRange,
  customerId?: string | null
): Promise<LiveBusinessData> {
  const payload = await fetchBackendJson<unknown>(
    affiliateEarnedPath(range, customerId)
  );
  return normalizeAffiliateEarned(payload);
}
