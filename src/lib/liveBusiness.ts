import { fetchBackendJson } from "./clientApi";
import { withCustomerId } from "./format";
import type {
  LiveBusinessData,
  LiveBusinessPoint,
  LiveBusinessRange,
} from "./types";

const LIVE_BUSINESS_PATH = "/api/v1/premium-dashboard/downline-live-business";

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

function formatPointLabel(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const date = new Date(`${raw}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  }
  return raw;
}

function normalizePoint(item: unknown, index: number): LiveBusinessPoint | null {
  const record = asRecord(item);
  if (!record) return null;

  const date = stringField(record, "date") || `Point ${index + 1}`;
  return {
    date,
    label: formatPointLabel(date),
    mtht: numberField(record, "totalMtht", "mtht"),
    usdt: numberField(record, "totalUsdt", "totalUsd", "usdt", "usd"),
    nftPurchased: numberField(record, "totalNftPurchased", "nftPurchased"),
  };
}

export function normalizeLiveBusiness(payload: unknown): LiveBusinessData {
  const record = asRecord(payload) ?? {};
  const chart = Array.isArray(record.chart) ? record.chart : [];

  return {
    range: stringField(record, "range") || undefined,
    summary: {
      range: stringField(record, "range") || undefined,
      startDate: stringField(record, "startDate") || undefined,
      endDate: stringField(record, "endDate") || undefined,
      totalMtht: numberField(record, "totalMtht"),
      totalUsdt: numberField(record, "totalUsdt", "totalUsd"),
      totalNftPurchased: numberField(record, "totalNftPurchased"),
    },
    series: chart
      .map(normalizePoint)
      .filter((point): point is LiveBusinessPoint => point !== null),
  };
}

export function liveBusinessPath(
  range?: LiveBusinessRange,
  customerId?: string | null
): string {
  const path = range
    ? `${LIVE_BUSINESS_PATH}?range=${encodeURIComponent(range)}`
    : LIVE_BUSINESS_PATH;
  return withCustomerId(path, customerId);
}

export async function fetchLiveBusiness(
  range?: LiveBusinessRange,
  customerId?: string | null
): Promise<LiveBusinessData> {
  const payload = await fetchBackendJson<unknown>(
    liveBusinessPath(range, customerId)
  );
  return normalizeLiveBusiness(payload);
}
