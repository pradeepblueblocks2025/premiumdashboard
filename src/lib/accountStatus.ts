export type AccountStatusId =
  | "legendary"
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "very_poor";

export type AccountStatusResult = {
  id: AccountStatusId;
  label: string;
  hint: string;
  ratio: number | null;
};

const LABELS: Record<AccountStatusId, { label: string; hint: string }> = {
  legendary: {
    label: "Legendary",
    hint: "Business ≥ 150% of affiliation",
  },
  excellent: {
    label: "Excellent",
    hint: "Business ≥ 110% of affiliation",
  },
  good: {
    label: "Good",
    hint: "Business matches affiliation",
  },
  fair: {
    label: "Fair",
    hint: "Business below affiliation",
  },
  poor: {
    label: "Poor",
    hint: "Business ≤ 60% of affiliation",
  },
  very_poor: {
    label: "Very Poor",
    hint: "Business ≤ 30% of affiliation",
  },
};

export function accountStatusFromTotals(
  business: number,
  affiliation: number
): AccountStatusResult {
  const safeBusiness = Number.isFinite(business) ? Math.max(0, business) : 0;
  const safeAffiliate = Number.isFinite(affiliation)
    ? Math.max(0, affiliation)
    : 0;

  if (safeBusiness <= 0 && safeAffiliate <= 0) {
    return { id: "good", ratio: 1, ...LABELS.good };
  }

  if (safeAffiliate <= 0) {
    return { id: "legendary", ratio: null, ...LABELS.legendary };
  }

  const ratio = safeBusiness / safeAffiliate;

  let id: AccountStatusId;
  if (ratio >= 1.5) id = "legendary";
  else if (ratio >= 1.1) id = "excellent";
  else if (ratio >= 0.995) id = "good";
  else if (ratio <= 0.3) id = "very_poor";
  else if (ratio <= 0.6) id = "poor";
  else id = "fair";

  return { id, ratio, ...LABELS[id] };
}

/** Map affiliation ratio onto a 0–100 Fear & Greed-style arc. */
export function ratioToGaugeScore(ratio: number | null): number {
  if (ratio == null) return 100;
  const percent = Math.max(0, ratio * 100);
  if (percent <= 30) return (percent / 30) * 20;
  if (percent <= 60) return 20 + ((percent - 30) / 30) * 20;
  if (percent <= 100) return 40 + ((percent - 60) / 40) * 20;
  if (percent <= 110) return 60 + ((percent - 100) / 10) * 15;
  if (percent <= 150) return 75 + ((percent - 110) / 40) * 25;
  return 100;
}
