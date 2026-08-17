export function formatNumber(
  value: number,
  decimals = 2,
  compact = false
): string {
  if (compact && value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatUsd(value: number, compact = false): string {
  return `$${formatNumber(value, 2, compact)}`;
}

export function formatMtht(value: number, compact = false): string {
  return `${formatNumber(value, 2, compact)} MTHT`;
}

export function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export interface JwtPayload {
  customerId?: string;
  emailAddress?: string;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof window !== "undefined"
        ? atob(base64)
        : Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function decodeJwtEmail(token: string): string | null {
  return decodeJwtPayload(token)?.emailAddress ?? null;
}

export function withCustomerId(
  path: string,
  customerId?: string | null
): string {
  if (!customerId) return path;
  const [base, existing] = path.split("?");
  const search = new URLSearchParams(existing ?? "");
  search.set("customerId", customerId);
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}
