import { DEFAULT_PROFILE_IMAGE } from "./avatar";
import type { PremiumDashboardData, DashboardViewModel, FirstLevelCustomer } from "./types";
import { transformDashboardData } from "./transformers";
import { decodeJwtEmail, formatMtht } from "./format";

export const EMPTY_DASHBOARD_DATA: PremiumDashboardData = {
  communityUsers: { totalCommunityUsers: 0, firstLevelUsers: 0 },
  activeStaking: {
    totalActiveMtht: 0,
    totalActiveUsd: 0,
    activeStakingCount: 0,
    totalActiveMthtUsd: 0,
  },
  rankCounts: [],
  boosterCounts: [],
  nftsByPrice: [],
  volumeByLevel: [],
  withdrawalAndTransfer: {
    totalWithdrawals: 0,
    totalFundTransfers: 0,
    totalWithdrawalsUsd: 0,
    totalFundTransfersUsd: 0,
  },
  stakingRewards: {
    totalStakingRewards: 0,
    totalStakingRewardsUsd: 0,
  },
  affiliateRewards: {
    totalAffiliateRewards: 0,
    totalAffiliateRewardsUsd: 0,
  },
  conversionRatio: 1,
};

export type DashboardSectionId =
  | "community-users"
  | "volume-by-level"
  | "purchase-stats"
  | "financial-stats"
  | "customer-stats";

export const DASHBOARD_SECTION_ORDER: DashboardSectionId[] = [
  "community-users",
  "volume-by-level",
  "purchase-stats",
  "financial-stats",
  "customer-stats",
];

export const SECTION_LABELS: Record<DashboardSectionId, string> = {
  "community-users": "Community users",
  "volume-by-level": "Volume by level",
  "purchase-stats": "Staking & NFT stats",
  "financial-stats": "Withdrawals & rewards",
  "customer-stats": "Rank & booster stats",
};

export function createInitialDashboardViewModel(
  token: string,
  viewingCustomer?: FirstLevelCustomer | null,
  profileImageUrl?: string | null
): DashboardViewModel {
  return transformDashboardData(
    EMPTY_DASHBOARD_DATA,
    token,
    viewingCustomer,
    profileImageUrl
  );
}

export function buildUserProfileFromToken(token: string) {
  const email = decodeJwtEmail(token) ?? "member@fortunenft.io";
  const nameFromEmail = email
    .split("@")[0]
    .replace(/[._]/g, " ")
    .toUpperCase();

  return {
    name: nameFromEmail,
    email,
    balance: formatMtht(0),
    avatar: DEFAULT_PROFILE_IMAGE,
  };
}

export function mergeSectionIntoDashboardData(
  current: PremiumDashboardData,
  section: DashboardSectionId,
  payload: Record<string, unknown>
): PremiumDashboardData {
  switch (section) {
    case "community-users":
      return {
        ...current,
        communityUsers: payload as PremiumDashboardData["communityUsers"],
      };
    case "volume-by-level":
      return {
        ...current,
        volumeByLevel: payload as unknown as PremiumDashboardData["volumeByLevel"],
      };
    case "purchase-stats": {
      const p = payload as {
        activeStaking: PremiumDashboardData["activeStaking"];
        nftsByPrice: PremiumDashboardData["nftsByPrice"];
        conversionRatio?: number;
      };
      return {
        ...current,
        activeStaking: p.activeStaking,
        nftsByPrice: p.nftsByPrice,
        conversionRatio: p.conversionRatio ?? current.conversionRatio,
      };
    }
    case "financial-stats": {
      const p = payload as {
        withdrawalAndTransfer: PremiumDashboardData["withdrawalAndTransfer"];
        stakingRewards: PremiumDashboardData["stakingRewards"];
        affiliateRewards: PremiumDashboardData["affiliateRewards"];
        conversionRatio?: number;
      };
      return {
        ...current,
        withdrawalAndTransfer: p.withdrawalAndTransfer,
        stakingRewards: p.stakingRewards,
        affiliateRewards: p.affiliateRewards,
        conversionRatio: p.conversionRatio ?? current.conversionRatio,
      };
    }
    case "customer-stats": {
      const p = payload as {
        rankCounts: PremiumDashboardData["rankCounts"];
        boosterCounts: PremiumDashboardData["boosterCounts"];
      };
      return {
        ...current,
        rankCounts: p.rankCounts,
        boosterCounts: p.boosterCounts,
      };
    }
    default:
      return current;
  }
}

export function toViewModel(
  data: PremiumDashboardData,
  token: string,
  viewingCustomer?: FirstLevelCustomer | null,
  profileImageUrl?: string | null
): DashboardViewModel {
  return transformDashboardData(data, token, viewingCustomer, profileImageUrl);
}
