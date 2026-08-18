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

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatYmd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toLocalYmd(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) return formatYmd(date);
  }

  return null;
}

function formatPointLabel(raw: string): string {
  const ymd = toLocalYmd(raw);
  if (ymd) {
    const date = new Date(`${ymd}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  }
  return raw;
}

function eachDay(startYmd: string, endYmd: string): string[] {
  const start = new Date(`${startYmd}T00:00:00`);
  const end = new Date(`${endYmd}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }

  const days: string[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(formatYmd(cursor));
  }
  return days;
}

export function calendarMonthRange(now = new Date()): { start: string; end: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: formatYmd(start), end: formatYmd(now) };
}

export function fillDailySeries(
  series: LiveBusinessPoint[],
  startYmd: string,
  endYmd: string
): LiveBusinessPoint[] {
  const byDate = new Map<string, LiveBusinessPoint>();
  for (const point of series) {
    const key = toLocalYmd(point.date) ?? point.date;
    byDate.set(key, point);
  }

  const days = eachDay(startYmd, endYmd);
  if (days.length === 0) return series;

  return days.map((date) => {
    const existing = byDate.get(date);
    if (existing) {
      return { ...existing, date, label: formatPointLabel(date) };
    }
    return {
      date,
      label: formatPointLabel(date),
      mtht: 0,
      usdt: 0,
      nftPurchased: 0,
    };
  });
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
