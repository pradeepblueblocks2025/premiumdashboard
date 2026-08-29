import { fetchBackendJson } from "./clientApi";
import { withCustomerId } from "./format";

const AFFILIATE_BY_LEGS_PATH =
  "/api/v1/premium-dashboard/downline-affiliate-by-legs";

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
  totalLegs: number;
  totalAffiliate: number;
  totalAffiliateUsd: number;
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

function normalizeLeg(item: unknown): AffiliateLeg | null {
  const record = asRecord(item);
  if (!record) return null;

  const firstname = stringField(record, "firstname");
  const lastname = stringField(record, "lastname");
  const combined = [firstname, lastname].filter(Boolean).join(" ").trim();

  return {
    legId: stringField(record, "legId", "id", "_id"),
    name: stringField(record, "name") || combined || "Unknown",
    email: stringField(record, "email"),
    rank: stringField(record, "rank"),
    totalAffiliate: numberField(record, "totalAffiliate", "totalMtht", "mtht"),
    totalAffiliateUsd: numberField(
      record,
      "totalAffiliateUsd",
      "totalUsd",
      "usdt"
    ),
    count: numberField(record, "count"),
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

export function normalizeAffiliateByLegs(payload: unknown): AffiliateByLegsData {
  const record = asRecord(payload) ?? {};
  const rawLegs = Array.isArray(record.legs) ? record.legs : [];
  const legs = rawLegs
    .map(normalizeLeg)
    .filter((leg): leg is AffiliateLeg => leg !== null);

  const totalAffiliate =
    numberField(record, "totalAffiliate", "totalMtht") ||
    legs.reduce((sum, leg) => sum + leg.totalAffiliate, 0);

  return {
    totalLegs: numberField(record, "totalLegs") || legs.length,
    totalAffiliate,
    totalAffiliateUsd:
      numberField(record, "totalAffiliateUsd") ||
      legs.reduce((sum, leg) => sum + leg.totalAffiliateUsd, 0),
    powerLeg: normalizePowerLeg(record.powerLeg),
    legs,
  };
}

export function affiliateByLegsPath(customerId?: string | null): string {
  return withCustomerId(AFFILIATE_BY_LEGS_PATH, customerId);
}

export async function fetchAffiliateByLegs(
  customerId?: string | null
): Promise<AffiliateByLegsData> {
  const payload = await fetchBackendJson<unknown>(
    affiliateByLegsPath(customerId)
  );
  return normalizeAffiliateByLegs(payload);
}
