export interface PremiumDashboardResponse {
  success: boolean;
  message: string;
  fromCache?: boolean;
  data: PremiumDashboardData;
}

export interface PremiumDashboardData {
  communityUsers: {
    totalCommunityUsers: number;
    firstLevelUsers: number;
  };
  activeStaking: {
    totalActiveMtht: number;
    totalActiveUsd: number;
    activeStakingCount: number;
    totalActiveMthtUsd: number;
  };
  rankCounts: Array<{ rank: string; count: number }>;
  boosterCounts: Array<{ stage: number; targetUsd: number; count: number }>;
  nftsByPrice: Array<{ count: number; totalMtht: number; priceUsd: number }>;
  volumeByLevel: Array<{
    level: number;
    totalMtht: number;
    totalUsd: number;
  }>;
  withdrawalAndTransfer: {
    totalWithdrawals: number;
    totalFundTransfers: number;
    totalWithdrawalsUsd: number;
    totalFundTransfersUsd: number;
  };
  stakingRewards: {
    totalStakingRewards: number;
    totalStakingRewardsUsd: number;
  };
  affiliateRewards: {
    totalAffiliateRewards: number;
    totalAffiliateRewardsUsd: number;
  };
  conversionRatio: number;
  rankProgress?: {
    currentRank: string | null;
    currentRankIndex: number;
    nextRank: string | null;
    inProgressRank?: string | null;
    ranks: RankProgressItem[];
  };
}

export interface VolumeLegItem {
  legId?: string;
  name: string;
  volumeUsd: number;
  volumeMtht?: number;
  isPowerLeg?: boolean;
}

export interface VolumeProgress {
  type: "volume";
  detailsLoaded?: boolean;
  powerLeg: {
    legId: string;
    name: string;
    volumeUsd: number;
    volumeMtht: number;
    targetUsd: number;
    achieved: boolean;
    color: string;
  };
  otherLegs: {
    volumeUsd: number;
    volumeMtht: number;
    targetUsd: number;
    achieved: boolean;
    color: string;
    legCount?: number;
    legs?: VolumeLegItem[];
  };
  allLegs?: VolumeLegItem[];
  achieved: boolean;
}

export interface LegMember {
  customerId?: string;
  level?: number;
  firstname?: string;
  lastname?: string;
  rank?: string;
}

export interface LegItem {
  legId?: string;
  name: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  directRank?: string;
  qualified: boolean;
  legStatus: "qualified" | "near" | "pending";
  color: string;
  statusLabel: string;
  qualifiedMembers?: LegMember[];
  downlineCount?: number;
  bestMember?: {
    name: string;
    rank: string;
    level: number;
    source: string;
  } | null;
}

export interface LegSlot {
  slot: number;
  filled: boolean;
  legId?: string;
  name?: string;
  directRank?: string;
  qualified: boolean;
  legStatus: "qualified" | "near" | "pending";
  color: string;
  statusLabel?: string;
  qualifiedMembers?: LegMember[];
  bestMember?: LegItem["bestMember"];
}

export interface LegsProgress {
  type: "legs";
  detailsLoaded?: boolean;
  requiredRank: string;
  requiredLegCount: number;
  qualifiedLegCount: number;
  nearLegCount?: number;
  pendingLegCount?: number;
  remainingLegCount?: number;
  achieved: boolean;
  requiredSlots: LegSlot[];
  qualifiedLegs?: LegItem[];
  nearLegs?: LegItem[];
  pendingLegs?: LegItem[];
  allLegs: LegItem[];
}

export interface RankProgressItem {
  code: number;
  rank: string;
  criteria: string;
  status: string;
  achieved: boolean;
  detailsLoaded?: boolean;
  progress: VolumeProgress | LegsProgress;
}

export interface MetricCardData {
  title: string;
  value: string;
  change: string | null;
  icon: string;
}

export interface RankAchieverData {
  rank: string;
  count: number;
  color: string;
}

export interface BoosterAchieverData {
  tier: string;
  count: number;
  color: string;
}

export interface NftPriceChartData {
  range: string;
  count: number;
  percent: number;
  color: string;
}

export interface VolumeLevelData {
  level: string;
  value: string;
  color: string;
}

export interface RankCriteriaSummaryItem {
  rank: string;
  requirement: string;
}

export interface LevelVolumeChartData {
  level: string;
  value: number;
}

export interface CommunityActivityItem {
  type: string;
  amount: string;
  positive: boolean;
  time: string;
}

export interface FirstLevelCustomer {
  customerId: string;
  name: string;
  email?: string;
  rank?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  balance: string;
  avatar: string;
  viewingDownline?: boolean;
}

export type LiveBusinessRange = "7days" | "month";

export interface LiveBusinessPoint {
  label: string;
  usd: number;
  mtht: number;
}

export interface LiveBusinessSummary {
  totalUsd: number;
  totalMtht: number;
  todayUsd?: number;
  todayMtht?: number;
  weekUsd?: number;
  weekMtht?: number;
  monthUsd?: number;
  monthMtht?: number;
  count?: number;
}

export interface LiveBusinessData {
  range?: string;
  summary: LiveBusinessSummary;
  series: LiveBusinessPoint[];
}

export interface DashboardViewModel {
  user: UserProfile;
  metricsRow1: MetricCardData[];
  metricsRow2: MetricCardData[];
  rankAchievers: RankAchieverData[];
  boosterAchievers: BoosterAchieverData[];
  nftPriceData: NftPriceChartData[];
  volumeLevels: VolumeLevelData[];
  rankTabs: string[];
  rankProgress?: PremiumDashboardData["rankProgress"];
  rankCriteriaSummary: RankCriteriaSummaryItem[];
  levelVolumeData: LevelVolumeChartData[];
  communityActivity: CommunityActivityItem[];
}
