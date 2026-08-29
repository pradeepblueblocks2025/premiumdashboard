import { fetchBackendJson } from "./clientApi";
import { withCustomerId } from "./format";
import type { AffiliatePeriodSummary } from "./affiliateEarned";

const AFFILIATE_BY_LEGS_PATH =
  "/api/v1/premium-dashboard/downline-affiliate-by-legs";

export type AffiliateByLegsRange = "today" | "yesterday" | "7days" | "month";

const EMPTY_PERIOD: AffiliatePeriodSummary = {
  totalMtht: 0,
  totalUsdt: 0,
  count: 0,
};

export type AffiliateLeg = {
  legId: string;
  name: string;
  email: string;
  rank: string;
  totalAffiliate: number;
  totalAffiliateUsd: number;
  count: number;
};

export type AffiliateByLegsData = {
  range?: AffiliateByLegsRange;
  today: AffiliatePeriodSummary;
  yesterday: AffiliatePeriodSummary;
  week: AffiliatePeriodSummary;
  month: AffiliatePeriodSummary;
  totalLegs: number;
  totalAffiliate: number;
  totalAffiliateUsd: number;
  count: number;
  powerLeg: {
    legId: string;
    name: string;
    email: string;
    totalAffiliate: number;
    totalAffiliateUsd: number;
  } | null;
  legs: AffiliateLeg[];
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

function stringField(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
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

function periodForRange(
  record: Record<string, unknown>,
  range?: AffiliateByLegsRange
): AffiliatePeriodSummary | null {
  if (!range) return null;
  const key = range === "7days" ? "7days" : range;
  const period = asRecord(record[key] ?? (range === "7days" ? record.week : undefined));
  return period ? normalizePeriod(period) : null;
}

function normalizeLeg(
  item: unknown,
  range?: AffiliateByLegsRange
): AffiliateLeg | null {
  const record = asRecord(item);
  if (!record) return null;

  const firstname = stringField(record, "firstname");
  const lastname = stringField(record, "lastname");
  const combined = [firstname, lastname].filter(Boolean).join(" ").trim();
  const selected = periodForRange(record, range);

  return {
    legId: stringField(record, "legId", "id", "_id"),
    name: stringField(record, "name") || combined || "Unknown",
    email: stringField(record, "email"),
    rank: stringField(record, "rank"),
    totalAffiliate:
      numberField(record, "totalAffiliate", "totalMtht", "mtht") ||
      selected?.totalMtht ||
      0,
    totalAffiliateUsd:
      numberField(record, "totalAffiliateUsd", "totalUsd", "usdt") ||
      selected?.totalUsdt ||
      0,
    count: numberField(record, "count") || selected?.count || 0,
  };
}

function normalizePowerLeg(
  value: unknown
): AffiliateByLegsData["powerLeg"] {
  const record = asRecord(value);
  if (!record) return null;

  return {
    legId: stringField(record, "legId", "id", "_id"),
    name: stringField(record, "name") || "Unknown",
    email: stringField(record, "email"),
    totalAffiliate: numberField(record, "totalAffiliate", "totalMtht", "mtht"),
    totalAffiliateUsd: numberField(record, "totalAffiliateUsd", "totalUsd"),
  };
}

export function normalizeAffiliateByLegs(
  payload: unknown,
  range?: AffiliateByLegsRange
): AffiliateByLegsData {
  const record = asRecord(payload) ?? {};
  const rawRange = stringField(record, "range");
  const resolvedRange: AffiliateByLegsRange | undefined =
    rawRange === "today" ||
    rawRange === "yesterday" ||
    rawRange === "7days" ||
    rawRange === "month"
      ? rawRange
      : range;

  const rawLegs = Array.isArray(record.legs) ? record.legs : [];
  const legs = rawLegs
    .map((item) => normalizeLeg(item, resolvedRange))
    .filter((leg): leg is AffiliateLeg => leg !== null);

  const selected = periodForRange(record, resolvedRange);
  const totalAffiliate =
    numberField(record, "totalAffiliate", "totalMtht") ||
    selected?.totalMtht ||
    legs.reduce((sum, leg) => sum + leg.totalAffiliate, 0);

  return {
    range: resolvedRange,
    today: normalizePeriod(record.today),
    yesterday: normalizePeriod(record.yesterday),
    week: normalizePeriod(record["7days"] ?? record.week),
    month: normalizePeriod(record.month),
    totalLegs: numberField(record, "totalLegs") || legs.length,
    totalAffiliate,
    totalAffiliateUsd:
      numberField(record, "totalAffiliateUsd") ||
      selected?.totalUsdt ||
      legs.reduce((sum, leg) => sum + leg.totalAffiliateUsd, 0),
    count:
      numberField(record, "count") ||
      selected?.count ||
      legs.reduce((sum, leg) => sum + leg.count, 0),
    powerLeg: normalizePowerLeg(record.powerLeg),
    legs,
  };
}

export function affiliateByLegsPath(
  customerId?: string | null,
  range?: AffiliateByLegsRange
): string {
  const path = range
    ? `${AFFILIATE_BY_LEGS_PATH}?range=${encodeURIComponent(range)}`
    : AFFILIATE_BY_LEGS_PATH;
  return withCustomerId(path, customerId);
}

export async function fetchAffiliateByLegs(
  customerId?: string | null,
  range?: AffiliateByLegsRange
): Promise<AffiliateByLegsData> {
  const payload = await fetchBackendJson<unknown>(
    affiliateByLegsPath(customerId, range)
  );
  return normalizeAffiliateByLegs(payload, range);
}
