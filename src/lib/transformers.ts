import type {
  DashboardViewModel,
  FirstLevelCustomer,
  LegsProgress,
  PremiumDashboardData,
  RankCriteriaSummaryItem,
  RankProgressItem,
  VolumeProgress,
} from "./types";
import { decodeJwtEmail, formatMtht, formatNumber, formatUsd } from "./format";

const RANK_COLORS = [
  "#fbbf24",
  "#94a3b8",
  "#f59e0b",
  "#60a5fa",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#fb923c",
  "#e879f9",
  "#22d3ee",
];

const BOOSTER_COLORS = [
  "#cd7f32",
  "#c0c0c0",
  "#ffd700",
  "#e5e4e2",
  "#b9f2ff",
  "#a855f7",
  "#6366f1",
  "#06b6d4",
  "#10b981",
];

const NFT_CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
];

const NFT_PRICE_RANGES = [
  { min: 0, max: 99, label: "Under $100" },
  { min: 100, max: 499, label: "$100 - $499" },
  { min: 500, max: 999, label: "$500 - $999" },
  { min: 1000, max: 4999, label: "$1,000 - $4,999" },
  { min: 5000, max: Infinity, label: "$5,000+" },
];

const DEFAULT_RANK_TABS = Array.from({ length: 10 }, (_, i) => `STAR ${i + 1}`);

const DEFAULT_RANK_CRITERIA_SUMMARY: RankCriteriaSummaryItem[] = [
  { rank: "STAR 1", requirement: "$5000 in power leg and $5000 in other legs (L1-L5 volume)" },
  ...Array.from({ length: 9 }, (_, i) => ({
    rank: `STAR ${i + 2}`,
    requirement: `3 STAR ${i + 1} achievers in Level 1 or 2 in 3 different legs`,
  })),
];
function buildUserProfile(
  data: PremiumDashboardData,
  token: string,
  viewingCustomer?: FirstLevelCustomer | null
): DashboardViewModel["user"] {
  if (viewingCustomer) {
    const seed = viewingCustomer.email || viewingCustomer.customerId;
    return {
      name: viewingCustomer.name.toUpperCase(),
      email: viewingCustomer.email ?? "",
      balance: formatMtht(data.activeStaking.totalActiveMtht),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`,
      viewingDownline: true,
    };
  }

  const email = decodeJwtEmail(token) ?? "member@fortunenft.io";
  const nameFromEmail = email
    .split("@")[0]
    .replace(/[._]/g, " ")
    .toUpperCase();

  return {
    name: nameFromEmail,
    email,
    balance: formatMtht(data.activeStaking.totalActiveMtht),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
  };
}

function buildMetrics(data: PremiumDashboardData): {
  row1: DashboardViewModel["metricsRow1"];
  row2: DashboardViewModel["metricsRow2"];
} {
  const nftVolumeUsd = data.nftsByPrice.reduce(
    (sum, item) => sum + item.count * item.priceUsd,
    0
  );
  const communityVolumeUsd = data.volumeByLevel.reduce(
    (sum, item) => sum + item.totalUsd,
    0
  );

  return {
    row1: [
      {
        title: "Total Community Users",
        value: formatNumber(data.communityUsers.totalCommunityUsers, 0),
        change: null,
        icon: "users",
      },
      {
        title: "Total Community Affiliation",
        value: formatMtht(data.affiliateRewards.totalAffiliateRewards, true),
        change: null,
        icon: "affiliate",
      },
      {
        title: "Staking Reward",
        value: formatMtht(data.stakingRewards.totalStakingRewards, true),
        change: null,
        icon: "staking",
      },
      {
        title: "Withdrawals & Transfers",
        value: formatMtht(
          data.withdrawalAndTransfer.totalWithdrawals +
            data.withdrawalAndTransfer.totalFundTransfers,
          true
        ),
        change: null,
        icon: "transfer",
      },
    ],
    row2: [
      {
        title: "Total Community Volume",
        value: formatUsd(communityVolumeUsd, true),
        change: null,
        icon: "volume",
      },
      {
        title: "NFT Volume",
        value: formatUsd(nftVolumeUsd, true),
        change: null,
        icon: "nft",
      },
    ],
  };
}

function buildNftPriceChart(
  nftsByPrice: PremiumDashboardData["nftsByPrice"]
): DashboardViewModel["nftPriceData"] {
  const grouped = NFT_PRICE_RANGES.map((range, index) => {
    const items = nftsByPrice.filter(
      (item) => item.priceUsd >= range.min && item.priceUsd <= range.max
    );
    const count = items.reduce((sum, item) => sum + item.count, 0);
    return {
      range: range.label,
      count,
      color: NFT_CHART_COLORS[index],
    };
  }).filter((item) => item.count > 0);

  const total = grouped.reduce((sum, item) => sum + item.count, 0);

  return grouped.map((item) => ({
    ...item,
    percent: total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0,
  }));
}

export function transformDashboardData(
  data: PremiumDashboardData,
  token: string,
  viewingCustomer?: FirstLevelCustomer | null
): DashboardViewModel {
  const metrics = buildMetrics(data);

  return {
    user: buildUserProfile(data, token, viewingCustomer),
    metricsRow1: metrics.row1,
    metricsRow2: metrics.row2,
    rankAchievers: data.rankCounts.map((item, index) => ({
      rank: item.rank,
      count: item.count,
      color: RANK_COLORS[index] ?? RANK_COLORS[0],
    })),
    boosterAchievers: data.boosterCounts.map((item, index) => ({
      tier: `Stage ${item.stage} ($${formatNumber(item.targetUsd, 0)})`,
      count: item.count,
      color: BOOSTER_COLORS[index] ?? BOOSTER_COLORS[0],
    })),
    nftPriceData: buildNftPriceChart(data.nftsByPrice),
    volumeLevels: data.volumeByLevel.map((item, index) => ({
      level: `Level ${item.level}`,
      value: formatUsd(item.totalUsd),
      color: RANK_COLORS[index] ?? RANK_COLORS[0],
    })),
    rankTabs: data.rankProgress?.ranks.map((r) => r.rank) ?? DEFAULT_RANK_TABS,
    rankProgress: data.rankProgress,
    rankCriteriaSummary:
      data.rankProgress?.ranks.map((rank) => ({
        rank: rank.rank,
        requirement: rank.criteria,
      })) ?? DEFAULT_RANK_CRITERIA_SUMMARY,
    levelVolumeData: data.volumeByLevel.map((item) => ({
      level: `Level ${item.level}`,
      value: item.totalUsd,
    })),
    communityActivity: [],
  };
}

export function isVolumeProgress(
  progress: RankProgressItem["progress"]
): progress is VolumeProgress {
  return progress.type === "volume";
}

export function isLegsProgress(
  progress: RankProgressItem["progress"]
): progress is LegsProgress {
  return progress.type === "legs";
}

export function getNextRankItem(
  ranks: RankProgressItem[],
  activeRank: string
): RankProgressItem | undefined {
  const index = ranks.findIndex((r) => r.rank === activeRank);
  if (index < 0 || index >= ranks.length - 1) return undefined;
  return ranks[index + 1];
}

export function barColorFromApi(color: string, achieved: boolean): string {
  if (achieved || color === "green") return "bg-emerald-500";
  if (color === "amber") return "bg-amber-500";
  if (color === "grey" || color === "disabled") return "bg-slate-600";
  return "bg-violet-500";
}

export function legStatusClasses(color: string, legStatus?: string): string {
  if (color === "green" || legStatus === "qualified") {
    return "bg-emerald-500/15 border-emerald-500 text-emerald-400";
  }
  if (color === "amber" || legStatus === "near") {
    return "bg-amber-500/15 border-amber-500 text-amber-400";
  }
  return "bg-[#131a35] border-[#2a3458] text-slate-500";
}

export function rankTabStatusClasses(status: string, active: boolean): string {
  if (active) {
    return "text-violet-400 border-b-2 border-violet-500 bg-violet-500/5";
  }
  if (status === "achieved") return "text-emerald-400 hover:text-emerald-300";
  if (status === "in_progress") return "text-amber-400 hover:text-amber-300";
  return "text-slate-500 hover:text-slate-300";
}
