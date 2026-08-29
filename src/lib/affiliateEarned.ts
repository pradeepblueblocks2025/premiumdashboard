import { fetchBackendJson } from "./clientApi";
import { formatPointLabel } from "./liveBusiness";
import { withCustomerId } from "./format";
import type { LiveBusinessPoint, LiveBusinessRange } from "./types";

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

function asChart(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function longestChart(record: Record<string, unknown>): unknown[] {
  const month = asRecord(record.month);
  const candidates = [
    asChart(record.chart),
    asChart(record.series),
    asChart(record.daily),
    asChart(record.monthChart),
    asChart(record.points),
    month ? asChart(month.chart) : [],
    month ? asChart(month.series) : [],
    month ? asChart(month.daily) : [],
  ];
  return candidates.reduce(
    (best, current) => (current.length > best.length ? current : best),
    [] as unknown[]
  );
}

export function normalizeAffiliateEarned(payload: unknown): AffiliateEarnedData {
  const record = asRecord(payload) ?? {};
  const conversionRatio = numberField(record, "conversionRatio");

  return {
    today: normalizePeriod(record.today),
    yesterday: normalizePeriod(record.yesterday),
    week: normalizePeriod(record["7days"] ?? record.week),
    month: normalizePeriod(record.month),
    series: longestChart(record)
      .map(normalizePoint)
      .filter((point): point is LiveBusinessPoint => point !== null),
    conversionRatio: conversionRatio || undefined,
  };
}

export type AffiliateChartRange = LiveBusinessRange | "yesterday";

export function affiliateEarnedPath(
  customerId?: string | null,
  range?: AffiliateChartRange
): string {
  const path = range
    ? `${AFFILIATE_EARNED_PATH}?range=${encodeURIComponent(range)}`
    : AFFILIATE_EARNED_PATH;
  return withCustomerId(path, customerId);
}

export async function fetchAffiliateEarned(
  customerId?: string | null,
  range?: AffiliateChartRange
): Promise<AffiliateEarnedData> {
  const payload = await fetchBackendJson<unknown>(
    affiliateEarnedPath(customerId, range)
  );
  return normalizeAffiliateEarned(payload);
}
