import { fetchBackendJson } from "./clientApi";
import { withCustomerId } from "./format";
import type {
  LiveBusinessData,
  LiveBusinessPoint,
  LiveBusinessRange,
  LiveBusinessSummary,
} from "./types";

const LIVE_BUSINESS_PATH = "/api/v1/premium-dashboard/downline-live-business";

const USD_KEYS = [
  "totalUsd",
  "totalBusinessUsd",
  "communityBusinessUsd",
  "businessUsd",
  "amountUsd",
  "usd",
  "valueUsd",
  "volumeUsd",
];

const MTHT_KEYS = [
  "totalMtht",
  "totalBusinessMtht",
  "communityBusinessMtht",
  "businessMtht",
  "amountMtht",
  "mtht",
  "valueMtht",
  "volumeMtht",
];

const TODAY_USD_KEYS = ["todayUsd", "todayBusinessUsd", "liveUsd", "currentUsd"];
const TODAY_MTHT_KEYS = ["todayMtht", "todayBusinessMtht", "liveMtht", "currentMtht"];
const WEEK_USD_KEYS = ["weekUsd", "last7DaysUsd", "sevenDaysUsd", "days7Usd"];
const WEEK_MTHT_KEYS = ["weekMtht", "last7DaysMtht", "sevenDaysMtht", "days7Mtht"];
const MONTH_USD_KEYS = ["monthUsd", "monthlyUsd", "thisMonthUsd"];
const MONTH_MTHT_KEYS = ["monthMtht", "monthlyMtht", "thisMonthMtht"];
const COUNT_KEYS = ["count", "orderCount", "orders", "transactions", "newUsers"];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickNumber(
  obj: Record<string, unknown> | null,
  keys: string[]
): number | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function firstNumber(...values: Array<number | undefined>): number {
  return values.find((value) => value !== undefined) ?? 0;
}

function formatPointLabel(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(raw) || raw.includes("T")) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      const hasTime = raw.includes("T") || /\d{2}:\d{2}/.test(raw);
      if (hasTime && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  }
  return raw;
}

function pointFromUnknown(item: unknown, index: number): LiveBusinessPoint | null {
  const record = asRecord(item);
  if (!record) return null;

  const usd = firstNumber(
    pickNumber(record, [
      "usd",
      "totalUsd",
      "businessUsd",
      "amountUsd",
      "value",
      "amount",
      "total",
    ])
  );
  const mtht = firstNumber(
    pickNumber(record, ["mtht", "totalMtht", "businessMtht", "amountMtht"])
  );
  const labelRaw =
    (typeof record.label === "string" && record.label) ||
    (typeof record.date === "string" && record.date) ||
    (typeof record.day === "string" && record.day) ||
    (typeof record.time === "string" && record.time) ||
    (typeof record.name === "string" && record.name) ||
    (typeof record.hour === "string" && record.hour) ||
    `Point ${index + 1}`;

  const hasDate =
    typeof record.date === "string" ||
    typeof record.time === "string" ||
    typeof record.day === "string" ||
    typeof record.label === "string";
  if (!usd && !mtht && !hasDate) return null;

  return {
    label: formatPointLabel(labelRaw),
    usd,
    mtht,
  };
}

function findSeries(payload: unknown, depth = 0): LiveBusinessPoint[] {
  if (depth > 3) return [];

  if (Array.isArray(payload)) {
    const points = payload
      .map(pointFromUnknown)
      .filter((point): point is LiveBusinessPoint => point !== null);
    return points.length > 0 ? points : [];
  }

  const record = asRecord(payload);
  if (!record) return [];

  const preferred = [
    record.series,
    record.chart,
    record.points,
    record.timeline,
    record.history,
    record.liveUpdates,
    record.days,
    record.items,
    record.records,
    record.graph,
  ];

  for (const candidate of preferred) {
    const points = findSeries(candidate, depth + 1);
    if (points.length > 0) return points;
  }

  return [];
}

function summaryFromRecord(record: Record<string, unknown> | null): LiveBusinessSummary {
  const nested = [
    record,
    asRecord(record?.summary),
    asRecord(record?.business),
    asRecord(record?.totals),
    asRecord(record?.stats),
    asRecord(record?.liveBusiness),
  ];

  const pick = (keys: string[]) =>
    firstNumber(...nested.map((item) => pickNumber(item, keys)));

  const optional = (keys: string[]) => {
    for (const item of nested) {
      const value = pickNumber(item, keys);
      if (value !== undefined) return value;
    }
    return undefined;
  };

  return {
    totalUsd: pick(USD_KEYS),
    totalMtht: pick(MTHT_KEYS),
    todayUsd: optional(TODAY_USD_KEYS),
    todayMtht: optional(TODAY_MTHT_KEYS),
    weekUsd: optional(WEEK_USD_KEYS),
    weekMtht: optional(WEEK_MTHT_KEYS),
    monthUsd: optional(MONTH_USD_KEYS),
    monthMtht: optional(MONTH_MTHT_KEYS),
    count: optional(COUNT_KEYS),
  };
}

function withSeriesTotals(data: LiveBusinessData): LiveBusinessData {
  const seriesUsd = data.series.reduce((sum, point) => sum + point.usd, 0);
  const seriesMtht = data.series.reduce((sum, point) => sum + point.mtht, 0);

  return {
    ...data,
    summary: {
      ...data.summary,
      totalUsd: data.summary.totalUsd || seriesUsd,
      totalMtht: data.summary.totalMtht || seriesMtht,
    },
  };
}

export function normalizeLiveBusiness(payload: unknown): LiveBusinessData {
  const record = asRecord(payload);
  return withSeriesTotals({
    range: typeof record?.range === "string" ? record.range : undefined,
    summary: summaryFromRecord(record),
    series: findSeries(payload),
  });
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
