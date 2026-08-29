import { fetchBackendJson } from "./clientApi";
import { formatPointLabel } from "./liveBusiness";
import { withCustomerId } from "./format";
import type { LiveBusinessPoint } from "./types";

const AFFILIATE_EARNED_PATH =
  "/api/v1/premium-dashboard/downline-affiliate-earned";

export type AffiliatePeriodSummary = {
  totalMtht: number;
  totalUsdt: number;
  count: number;
};

export type AffiliateEarnedData = {
  today: AffiliatePeriodSummary;
  yesterday: AffiliatePeriodSummary;
  week: AffiliatePeriodSummary;
  month: AffiliatePeriodSummary;
  series: LiveBusinessPoint[];
  conversionRatio?: number;
};

const EMPTY_PERIOD: AffiliatePeriodSummary = {
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

function stringField(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  return typeof value === "string" ? value : "";
}

function normalizePeriod(value: unknown): AffiliatePeriodSummary {
  const record = asRecord(value);
  if (!record) return EMPTY_PERIOD;

  return {
    totalMtht: numberField(record, "totalAffiliate", "totalMtht", "mtht"),
    totalUsdt: numberField(
      record,
      "totalAffiliateUsd",
      "totalUsdt",
      "totalUsd",
      "usdt"
    ),
    count: numberField(record, "count", "totalAffiliates", "affiliateCount"),
  };
}

function normalizePoint(item: unknown, index: number): LiveBusinessPoint | null {
  const record = asRecord(item);
  if (!record) return null;

  const date = stringField(record, "date") || `Point ${index + 1}`;
  return {
    date,
    label: formatPointLabel(date),
    mtht: numberField(record, "totalAffiliate", "totalMtht", "mtht"),
    usdt: numberField(
      record,
      "totalAffiliateUsd",
      "totalUsdt",
      "totalUsd",
      "usdt"
    ),
    nftPurchased: numberField(record, "count"),
  };
}

export function normalizeAffiliateEarned(payload: unknown): AffiliateEarnedData {
  const record = asRecord(payload) ?? {};
  const chart = Array.isArray(record.chart) ? record.chart : [];
  const conversionRatio = numberField(record, "conversionRatio");

  return {
    today: normalizePeriod(record.today),
    yesterday: normalizePeriod(record.yesterday),
    week: normalizePeriod(record["7days"] ?? record.week),
    month: normalizePeriod(record.month),
    series: chart
      .map(normalizePoint)
      .filter((point): point is LiveBusinessPoint => point !== null),
    conversionRatio: conversionRatio || undefined,
  };
}

export function affiliateEarnedPath(customerId?: string | null): string {
  return withCustomerId(AFFILIATE_EARNED_PATH, customerId);
}

export async function fetchAffiliateEarned(
  customerId?: string | null
): Promise<AffiliateEarnedData> {
  const payload = await fetchBackendJson<unknown>(
    affiliateEarnedPath(customerId)
  );
  return normalizeAffiliateEarned(payload);
}
