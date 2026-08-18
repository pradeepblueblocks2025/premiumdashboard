"use client";

import {
  Bell,
  Menu,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  ArrowLeftRight,
  Wallet,
  Users,
  Network,
  Coins,
  Gift,
  TrendingUp,
  ImageIcon,
  Star,
  Trophy,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Target,
  LogOut,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useState, useEffect } from "react";
import type {
  BoosterAchieverData,
  CommunityActivityItem,
  DashboardViewModel,
  FirstLevelCustomer,
  LegsProgress,
  MetricCardData,
  NftPriceChartData,
  PremiumDashboardData,
  RankAchieverData,
  RankCriteriaSummaryItem,
  RankProgressItem,
  UserProfile,
  VolumeLevelData,
} from "@/lib/types";
import {
  barColorFromApi,
  isLegsProgress,
  isVolumeProgress,
  legStatusClasses,
  rankTabStatusClasses,
} from "@/lib/transformers";
import { formatUsd, progressPercent } from "@/lib/format";
import { fetchBackendJson } from "@/lib/clientApi";
import { mergeRankDetail } from "@/lib/api";
import { clearStoredToken } from "@/lib/auth";
import { withCustomerId } from "@/lib/format";
import { useRouter } from "next/navigation";
import type { DashboardSectionId } from "@/lib/dashboardSections";
import BrandLogo from "@/components/BrandLogo";
import CustomerSwitcher from "@/components/CustomerSwitcher";
import LiveBusinessSection from "@/components/LiveBusinessSection";

const metricIcons: Record<string, React.ReactNode> = {
  users: <Users className="w-4 h-4 text-violet-400" />,
  network: <Network className="w-4 h-4 text-cyan-400" />,
  staking: <Layers className="w-4 h-4 text-emerald-400" />,
  withdraw: <ArrowUpFromLine className="w-4 h-4 text-orange-400" />,
  transfer: <ArrowLeftRight className="w-4 h-4 text-blue-400" />,
  reward: <Gift className="w-4 h-4 text-pink-400" />,
  affiliate: <TrendingUp className="w-4 h-4 text-yellow-400" />,
  volume: <Coins className="w-4 h-4 text-indigo-400" />,
  nft: <ImageIcon className="w-4 h-4 text-purple-400" />,
};

function Header({
  customers,
  selectedCustomerId,
  customersLoading,
  customersError,
  onSelectCustomer,
}: {
  customers: FirstLevelCustomer[];
  selectedCustomerId: string | null;
  customersLoading: boolean;
  customersError: string | null;
  onSelectCustomer: (customerId: string | null) => void;
}) {
  const router = useRouter();

  function handleLogout() {
    clearStoredToken();
    router.replace("/");
  }

  return (
    <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <BrandLogo size={32} priority />
        <span className="font-bold text-white tracking-wide text-sm truncate">
          FORTUNE NFT
        </span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <CustomerSwitcher
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          loading={customersLoading}
          error={customersError}
          onSelect={onSelectCustomer}
        />
        <button
          type="button"
          onClick={handleLogout}
          className="w-9 h-9 rounded-full bg-[#131a35] border border-[#1a2240] flex items-center justify-center hover:bg-[#1a2240] transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
        </button>
        <button className="w-9 h-9 rounded-full bg-[#131a35] border border-[#1a2240] flex items-center justify-center hover:bg-[#1a2240] transition-colors">
          <Bell className="w-4 h-4 text-slate-400" />
        </button>
        <button className="w-9 h-9 rounded-full bg-[#131a35] border border-[#1a2240] flex items-center justify-center hover:bg-[#1a2240] transition-colors">
          <Menu className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
}

function ProfileBanner({ user }: { user: UserProfile }) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="mx-3 sm:mx-4 mb-4 rounded-xl overflow-hidden border border-[#1a2240] grid-bg bg-[#0a0f24]">
      <div className="p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#1a2240] border-2 border-[#2a3458]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0a0f24]">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-sm sm:text-base tracking-wide truncate">
            {user.name}
          </h2>
          {user.viewingDownline && (
            <p className="text-[10px] text-violet-400 mt-0.5">
              Viewing first-level customer
            </p>
          )}
          <p className="text-xs text-slate-500 mt-0.5 truncate">{user.email}</p>
          <div className="mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Total Active Staking</span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-slate-500 hover:text-slate-300"
              >
                {showBalance ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-xl sm:text-2xl font-bold gradient-text mt-0.5 break-all sm:break-normal">
              {showBalance ? user.balance : "••••••••"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: "Deposit", icon: ArrowDownToLine },
    { label: "Withdraw", icon: ArrowUpFromLine },
    { label: "Staking", icon: Layers },
    { label: "Swap", icon: ArrowLeftRight },
    { label: "Wallet", icon: Wallet },
  ];

  return (
    <div className="mb-4 overflow-x-auto scrollbar-hide">
      <div className="flex sm:grid sm:grid-cols-5 gap-2 px-3 sm:px-4 min-w-max sm:min-w-0">
        {actions.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="flex-shrink-0 w-[4.5rem] sm:w-auto flex flex-col items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl bg-[#0d1228] border border-[#1a2240] hover:border-violet-500/40 hover:bg-[#131a35] transition-all group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#131a35] border border-[#2a3458] flex items-center justify-center group-hover:border-violet-500/50 transition-colors">
              <Icon className="w-4 h-4 text-slate-300" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon,
  loading = false,
}: MetricCardData & { loading?: boolean }) {
  return (
    <div className="card p-3 hover:border-violet-500/30 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-[#131a35] flex items-center justify-center">
          {metricIcons[icon]}
        </div>
      </div>
      <p className="text-[10px] text-slate-500 leading-tight mb-1">{title}</p>
      {loading ? (
        <div className="h-4 w-16 rounded bg-[#1a2240] animate-pulse" />
      ) : (
        <p className="text-xs sm:text-sm font-bold text-white break-all sm:break-normal">
          {value}
        </p>
      )}
      {change && (
        <p className="text-[10px] text-emerald-400 mt-1">
          <span className="sm:hidden">{change}</span>
          <span className="hidden sm:inline">{change} from last 30 days</span>
        </p>
      )}
    </div>
  );
}

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="card p-4 flex flex-col items-center justify-center min-h-[140px] gap-2">
      <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function StatsGrid({
  metricsRow1,
  metricsRow2,
  loadingSections,
}: {
  metricsRow1: MetricCardData[];
  metricsRow2: MetricCardData[];
  loadingSections?: Set<string>;
}) {
  const communityLoading = loadingSections?.has("community-users");
  const purchaseLoading = loadingSections?.has("purchase-stats");
  const financialLoading = loadingSections?.has("financial-stats");

  const row1Loading = [communityLoading, communityLoading, purchaseLoading, financialLoading, financialLoading];
  const row2Loading = [financialLoading, financialLoading, financialLoading, loadingSections?.has("customer-stats")];

  return (
    <div className="mx-3 sm:mx-4 mb-4 space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {metricsRow1.map((m, i) => (
          <MetricCard key={m.title} {...m} loading={row1Loading[i]} />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {metricsRow2.map((m, i) => (
          <MetricCard key={m.title} {...m} loading={row2Loading[i]} />
        ))}
      </div>
    </div>
  );
}

function RankAchieversCard({ rankAchievers }: { rankAchievers: RankAchieverData[] }) {
  return (
    <div className="card p-4">
      <h3 className="text-xs font-semibold text-slate-300 mb-3">
        Rank Achievers in Downline
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {rankAchievers.map(({ rank, count, color }) => (
          <div key={rank} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <Star className="w-3 h-3 flex-shrink-0" style={{ color, fill: color }} />
              <span className="text-[10px] text-slate-400 truncate">{rank}</span>
            </div>
            <span className="text-xs font-semibold text-white ml-2">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoosterAchieversCard({
  boosterAchievers,
}: {
  boosterAchievers: BoosterAchieverData[];
}) {
  return (
    <div className="card p-4">
      <h3 className="text-xs font-semibold text-slate-300 mb-3">
        Booster Achievers
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
        {boosterAchievers.map(({ tier, count, color }) => (
          <div key={tier} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
              <span className="text-[10px] text-slate-400 truncate">{tier}</span>
            </div>
            <span className="text-xs font-semibold text-white">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NFTDonutChart({ nftPriceData }: { nftPriceData: NftPriceChartData[] }) {
  const total = nftPriceData.reduce((s, d) => s + d.count, 0);

  if (nftPriceData.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-slate-300 mb-3">
          NFTs by USDT Price
        </h3>
        <p className="text-xs text-slate-500 text-center py-8">No NFT data available</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-xs font-semibold text-slate-300 mb-3">
        NFTs by USDT Price
      </h3>
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-2">
        <div className="relative w-32 h-32 sm:w-28 sm:h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={nftPriceData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                paddingAngle={2}
                dataKey="count"
              >
                {nftPriceData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[8px] text-slate-500">Total NFTs</span>
            <span className="text-xs font-bold text-white">
              {total.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="w-full sm:flex-1 space-y-1.5">
          {nftPriceData.map(({ range, count, percent, color }) => (
            <div key={range} className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[9px] text-slate-400 flex-1 truncate">
                {range}
              </span>
              <span className="text-[9px] text-white font-medium flex-shrink-0">
                {count.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 w-8 text-right flex-shrink-0">
                {percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VolumeLevelsStrip({ volumeLevels }: { volumeLevels: VolumeLevelData[] }) {
  return (
    <div className="mx-3 sm:mx-4 mb-4 card p-3">
      <h3 className="text-xs font-semibold text-slate-300 mb-3">
        Volume Level (Top 5 Levels)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {volumeLevels.map(({ level, value, color }) => (
          <div
            key={level}
            className="text-center p-2 rounded-lg bg-[#131a35] border border-[#1a2240]"
          >
            <Star
              className="w-3.5 h-3.5 mx-auto mb-1"
              style={{ color, fill: color }}
            />
            <p className="text-[9px] text-slate-500">{level}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-white mt-0.5 break-all sm:break-normal">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankStatusBadge({ status }: { status: string }) {
  if (status === "achieved") {
    return (
      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        Achieved
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
        In Progress
      </span>
    );
  }
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-600/30">
      Locked
    </span>
  );
}

function VolumeProgressPanel({ rank }: { rank: RankProgressItem }) {
  if (!isVolumeProgress(rank.progress)) return null;

  const { powerLeg, otherLegs, allLegs } = rank.progress;
  const powerPercent = progressPercent(powerLeg.volumeUsd, powerLeg.targetUsd);
  const otherPercent = progressPercent(otherLegs.volumeUsd, otherLegs.targetUsd);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-slate-500">{rank.criteria}</p>
        <RankStatusBadge status={rank.status} />
      </div>
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] text-slate-400">
            Power Leg {powerLeg.name ? `(${powerLeg.name})` : ""}
          </span>
          <span
            className={`text-[10px] ${powerLeg.achieved ? "text-emerald-400" : "text-slate-400"}`}
          >
            {powerPercent}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#1a2240] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColorFromApi(powerLeg.color, powerLeg.achieved)}`}
            style={{ width: `${powerPercent}%` }}
          />
        </div>
        <p className="text-[9px] text-slate-600 mt-1">
          {formatUsd(powerLeg.volumeUsd)} / {formatUsd(powerLeg.targetUsd)}
        </p>
      </div>
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] text-slate-400">
            Other Legs Combined ({otherLegs.legCount ?? 0} legs)
          </span>
          <span
            className={`text-[10px] ${otherLegs.achieved ? "text-emerald-400" : "text-slate-400"}`}
          >
            {otherPercent}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#1a2240] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColorFromApi(otherLegs.color, otherLegs.achieved)}`}
            style={{ width: `${otherPercent}%` }}
          />
        </div>
        <p className="text-[9px] text-slate-600 mt-1">
          {formatUsd(otherLegs.volumeUsd)} / {formatUsd(otherLegs.targetUsd)}
        </p>
      </div>
      {allLegs && allLegs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-slate-400">Leg Volume Breakdown</p>
          {allLegs.map((leg, i) => (
            <div
              key={leg.legId ?? i}
              className={`flex items-center justify-between p-2 rounded-lg border text-[10px] ${
                leg.isPowerLeg
                  ? "border-violet-500/30 bg-violet-500/5"
                  : "border-[#1a2240] bg-[#131a35]"
              }`}
            >
              <span className="text-slate-300 truncate mr-2">
                {leg.name}
                {leg.isPowerLeg ? " (Power)" : ""}
              </span>
              <span className="text-slate-400 flex-shrink-0">
                {formatUsd(leg.volumeUsd)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LegSlotIcon({ slot }: { slot: LegsProgress["requiredSlots"][number] }) {
  const qualified = slot.qualified || slot.legStatus === "qualified";
  return (
    <div className="flex flex-col items-center min-w-[72px] max-w-[88px]">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${legStatusClasses(slot.color, slot.legStatus)}`}
      >
        {qualified ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : slot.legStatus === "near" ? (
          <Circle className="w-4 h-4 text-amber-400" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </div>
      <span className="text-[9px] text-slate-400 mt-1">Slot {slot.slot}</span>
      <span className="text-[8px] text-center truncate w-full px-1">
        {slot.name ?? slot.statusLabel ?? "Needed"}
      </span>
      <span
        className={`text-[8px] ${qualified ? "text-emerald-400" : slot.legStatus === "near" ? "text-amber-400" : "text-slate-600"}`}
      >
        {slot.statusLabel ?? (qualified ? "Achieved" : "Pending")}
      </span>
    </div>
  );
}

function LegRow({ leg, requiredRank }: { leg: LegsProgress["allLegs"][number]; requiredRank: string }) {
  return (
    <div
      className={`p-2.5 rounded-lg border ${legStatusClasses(leg.color, leg.legStatus)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium truncate">{leg.name}</p>
          <p className="text-[9px] opacity-80 mt-0.5">
            Direct: {leg.directRank || "No rank"}
          </p>
        </div>
        <span className="text-[9px] flex-shrink-0">{leg.statusLabel}</span>
      </div>
      {leg.bestMember && (
        <p className="text-[9px] mt-1.5 opacity-90">
          {leg.qualified
            ? `Qualified via: ${leg.bestMember.name} (${leg.bestMember.rank}) at L${leg.bestMember.level}`
            : `Closest: ${leg.bestMember.name} (${leg.bestMember.rank || "No rank"}) at L${leg.bestMember.level} — needs ${requiredRank}`}
        </p>
      )}
      {!leg.qualified && leg.downlineCount !== undefined && leg.downlineCount > 0 && (
        <p className="text-[9px] mt-1 opacity-75">
          {leg.downlineCount} member(s) in L1-L2 — needs {requiredRank} in this leg
        </p>
      )}
    </div>
  );
}

function LegsProgressPanel({ rank }: { rank: RankProgressItem }) {
  if (!isLegsProgress(rank.progress)) return null;

  const {
    requiredRank,
    requiredLegCount,
    qualifiedLegCount,
    nearLegCount = 0,
    remainingLegCount = 0,
    requiredSlots,
    qualifiedLegs = [],
    nearLegs = [],
    allLegs,
  } = rank.progress;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-slate-500">{rank.criteria}</p>
        <RankStatusBadge status={rank.status} />
      </div>

      <div className="p-3 rounded-lg bg-[#131a35] border border-[#1a2240]">
        <p className="text-[10px] text-slate-400 mb-1">Progress to {rank.rank}</p>
        <p className="text-lg font-bold text-white">
          {qualifiedLegCount}{" "}
          <span className="text-sm text-slate-500">/ {requiredLegCount} legs</span>
        </p>
        <p className="text-[9px] text-slate-600 mt-1">
          Need {requiredLegCount} different legs with {requiredRank} at Level 1 or 2
        </p>
        {remainingLegCount > 0 && rank.status !== "locked" && (
          <p className="text-[9px] text-amber-400 mt-1">
            {remainingLegCount} more qualified leg(s) required
            {nearLegCount > 0 ? ` · ${nearLegCount} leg(s) near qualification` : ""}
          </p>
        )}
      </div>

      <div>
        <p className="text-[10px] text-slate-400 mb-2">Required Leg Slots</p>
        <div className="flex flex-wrap justify-center gap-3">
          {requiredSlots.map((slot) => (
            <LegSlotIcon key={slot.slot} slot={slot} />
          ))}
        </div>
      </div>

      {qualifiedLegs.length > 0 && (
        <div>
          <p className="text-[10px] text-emerald-400 mb-2">
            Qualified Legs ({qualifiedLegCount}/{requiredLegCount})
          </p>
          <div className="space-y-2">
            {qualifiedLegs.map((leg, i) => (
              <LegRow key={leg.legId ?? i} leg={leg} requiredRank={requiredRank} />
            ))}
          </div>
        </div>
      )}

      {nearLegs.length > 0 && rank.status !== "achieved" && (
        <div>
          <p className="text-[10px] text-amber-400 mb-2">Legs Near Qualification</p>
          <div className="space-y-2">
            {nearLegs.map((leg, i) => (
              <LegRow key={leg.legId ?? i} leg={leg} requiredRank={requiredRank} />
            ))}
          </div>
        </div>
      )}

      {allLegs.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-400 mb-2">All Direct Legs</p>
          <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-hide">
            {allLegs.map((leg, i) => (
              <LegRow key={leg.legId ?? i} leg={leg} requiredRank={requiredRank} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RankCriteriaSection({
  rankTabs,
  rankProgress: initialRankProgress,
  error = null,
  customerId = null,
}: {
  rankTabs: string[];
  rankProgress?: DashboardViewModel["rankProgress"];
  error?: string | null;
  customerId?: string | null;
}) {
  const [rankProgress, setRankProgress] = useState(initialRankProgress);
  const [loadingRank, setLoadingRank] = useState<string | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);

  useEffect(() => {
    setRankProgress(initialRankProgress);
  }, [initialRankProgress]);

  const defaultTab =
    rankProgress?.inProgressRank ??
    rankProgress?.ranks.find((r) => r.status === "in_progress")?.rank ??
    rankProgress?.currentRank ??
    rankProgress?.nextRank ??
    rankTabs[0];
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (rankProgress?.inProgressRank) {
      setActiveTab(rankProgress.inProgressRank);
    }
  }, [rankProgress?.inProgressRank]);

  const activeRank = rankProgress?.ranks.find((r) => r.rank === activeTab);
  const needsDetail =
    !!activeRank &&
    activeRank.status !== "locked" &&
    activeRank.detailsLoaded === false &&
    activeRank.progress?.detailsLoaded === false;

  useEffect(() => {
    if (!needsDetail || loadingRank === activeTab) return;

    let cancelled = false;

    async function loadRankDetail() {
      setLoadingRank(activeTab);
      setTabError(null);

      try {
        const { rank: rankItem } = await fetchBackendJson<{ rank: RankProgressItem }>(
          withCustomerId(
            `/api/v1/premium-dashboard/rank-progress?rank=${encodeURIComponent(activeTab)}`,
            customerId
          )
        );

        if (!cancelled) {
          setRankProgress((prev) =>
            prev ? mergeRankDetail(prev, rankItem) : prev
          );
        }
      } catch (err) {
        if (!cancelled) {
          setTabError(
            err instanceof Error ? err.message : "Failed to load rank details"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRank(null);
        }
      }
    }

    loadRankDetail();

    return () => {
      cancelled = true;
    };
  }, [activeTab, needsDetail, loadingRank, customerId]);

  const showingRankLoader = needsDetail && loadingRank === activeTab;

  return (
    <div className="mx-3 sm:mx-4 mb-4 card overflow-hidden">
      <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-[#1a2240]">
        <h3 className="text-xs font-semibold text-slate-300">Rank Achievement Criteria</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Current: {rankProgress?.currentRank ?? "—"} · Next:{" "}
          {rankProgress?.nextRank ?? "Max rank reached"}
        </p>
      </div>
      <div className="flex overflow-x-auto scrollbar-hide border-b border-[#1a2240] -mx-px">
        {(rankProgress?.ranks ?? rankTabs.map((rank) => ({ rank, status: "locked" }))).map(
          (rankItem) => (
          <button
            key={rankItem.rank}
            onClick={() => setActiveTab(rankItem.rank)}
            disabled={!rankProgress}
            className={`flex-shrink-0 px-2.5 sm:px-3 py-2.5 text-[10px] font-medium transition-colors flex flex-col items-center gap-0.5 ${rankTabStatusClasses(rankItem.status ?? "locked", activeTab === rankItem.rank)}`}
          >
            <span>{rankItem.rank}</span>
            {rankItem.status === "achieved" && (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            )}
            {rankItem.status === "in_progress" && (
              <Circle className="w-3 h-3 text-amber-400 fill-amber-400/30" />
            )}
          </button>
        ))}
      </div>
      <div className="p-3 sm:p-4">
        <h4 className="text-xs font-semibold text-slate-300 mb-4">
          {activeTab} Requirements
        </h4>
        {showingRankLoader ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            <p className="text-[10px] text-slate-500">Loading rank progress...</p>
          </div>
        ) : tabError ? (
          <p className="text-xs text-red-400">{tabError}</p>
        ) : error && !rankProgress ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : activeRank ? (
          activeRank.progress?.detailsLoaded === false &&
          activeRank.status === "locked" ? (
            <p className="text-xs text-slate-500">
              Complete previous ranks to unlock leg details for this rank.
            </p>
          ) : isVolumeProgress(activeRank.progress) ? (
            <VolumeProgressPanel rank={activeRank} />
          ) : (
            <LegsProgressPanel rank={activeRank} />
          )
        ) : (
          <p className="text-xs text-slate-500">No criteria available</p>
        )}
      </div>
    </div>
  );
}

function LazyRankProgressPanel({
  rankTabs,
  rankCriteriaSummary,
  customerId = null,
}: {
  rankTabs: string[];
  rankCriteriaSummary: RankCriteriaSummaryItem[];
  customerId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [rankProgress, setRankProgress] = useState<
    PremiumDashboardData["rankProgress"] | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPanel() {
    setOpen(true);
    if (rankProgress) return;

    setLoading(true);
    setError(null);

    try {
      const body = await fetchBackendJson<
        NonNullable<PremiumDashboardData["rankProgress"]>
      >(withCustomerId("/api/v1/premium-dashboard/rank-progress", customerId));

      setRankProgress(body);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load rank progress"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="mx-3 sm:mx-4 mb-4 card overflow-hidden">
        <button
          type="button"
          onClick={openPanel}
          className="w-full px-4 py-4 flex items-center justify-between gap-3 text-left hover:bg-violet-500/5 transition-colors"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-violet-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-slate-200">
                Rank Achievement Criteria
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Tap to load your rank progress, leg qualification, and next-rank requirements.
              </p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-3 sm:mx-4 mb-4">
      <div className="card overflow-hidden mb-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left border-b border-[#1a2240] hover:bg-violet-500/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-slate-200">
              Rank Achievement Criteria
            </span>
          </div>
          <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
        </button>
      </div>

      {loading && !rankProgress ? (
        <div className="card flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          <p className="text-[10px] text-slate-500">Loading rank progress...</p>
        </div>
      ) : error && !rankProgress ? (
        <div className="card p-4">
          <p className="text-xs text-red-400 mb-3">{error}</p>
          <button
            type="button"
            onClick={openPanel}
            className="text-[10px] text-violet-400 border border-violet-500/30 rounded-lg px-3 py-1.5 hover:bg-violet-500/10"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <RankCriteriaSection
            rankTabs={rankTabs}
            rankProgress={rankProgress}
            customerId={customerId}
          />
          <div className="mt-3">
            <RankCriteriaSummary rankCriteriaSummary={rankCriteriaSummary} />
          </div>
        </>
      )}
    </div>
  );
}

function RankCriteriaSummary({
  rankCriteriaSummary,
}: {
  rankCriteriaSummary: RankCriteriaSummaryItem[];
}) {
  return (
    <div className="card p-4 flex flex-col h-full">
      <h3 className="text-xs font-semibold text-slate-300 mb-3">
        Rank Criteria Summary
      </h3>
      <div className="space-y-2 flex-1">
        {rankCriteriaSummary.map(({ rank, requirement }) => (
          <div
            key={rank}
            className="flex items-start gap-2 p-2 rounded-lg bg-[#131a35] border border-[#1a2240]"
          >
            <Star className="w-3 h-3 text-violet-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-semibold text-violet-400">
                {rank}
              </span>
              <p className="text-[10px] text-slate-400">{requirement}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-3 w-full py-2 text-[10px] font-medium text-violet-400 border border-violet-500/30 rounded-lg hover:bg-violet-500/10 transition-colors">
        View All Criteria
      </button>
    </div>
  );
}

function LevelVolumeChart({
  levelVolumeData,
}: {
  levelVolumeData: DashboardViewModel["levelVolumeData"];
}) {
  return (
    <div className="card p-4 flex flex-col h-full">
      <h3 className="text-xs font-semibold text-slate-300 mb-3">
        Level Volume Overview
      </h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={levelVolumeData}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="level"
              width={50}
              tick={{ fill: "#64748b", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0d1228",
                border: "1px solid #1a2240",
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(value) => [
                `$${Number(value).toLocaleString()}`,
                "Volume",
              ]}
            />
            <Bar
              dataKey="value"
              fill="#8b5cf6"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CommunityActivityCard({
  communityActivity,
}: {
  communityActivity: CommunityActivityItem[];
}) {
  const activityIcons: Record<string, React.ReactNode> = {
    Deposit: <ArrowDownToLine className="w-3 h-3" />,
    Purchase: <ImageIcon className="w-3 h-3" />,
    Withdraw: <ArrowUpFromLine className="w-3 h-3" />,
    "Staking Reward": <Gift className="w-3 h-3" />,
    "Affiliate Reward": <TrendingUp className="w-3 h-3" />,
    Transfer: <ArrowLeftRight className="w-3 h-3" />,
  };

  return (
    <div className="card p-4 flex flex-col h-full">
      <h3 className="text-xs font-semibold text-slate-300 mb-3">
        Community Activity (24h)
      </h3>
      <div className="space-y-2 flex-1">
        {communityActivity.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No recent activity available
          </p>
        ) : (
          communityActivity.map(({ type, amount, positive, time }) => (
            <div
              key={`${type}-${time}`}
              className="flex items-center justify-between py-1.5 border-b border-[#1a2240]/50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    positive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {activityIcons[type] ?? <Circle className="w-3 h-3" />}
                </div>
                <div>
                  <p className="text-[10px] text-slate-300">{type}</p>
                  <p className="text-[9px] text-slate-600">{time}</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-medium flex-shrink-0 text-right ${
                  positive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {amount}
              </span>
            </div>
          ))
        )}
      </div>
      <button className="mt-3 w-full py-2 text-[10px] font-medium text-violet-400 border border-violet-500/30 rounded-lg hover:bg-violet-500/10 transition-colors">
        View All Activity
      </button>
    </div>
  );
}

function BottomGrid({
  levelVolumeData,
  communityActivity,
}: {
  levelVolumeData: DashboardViewModel["levelVolumeData"];
  communityActivity: CommunityActivityItem[];
}) {
  return (
    <div className="mx-3 sm:mx-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <LevelVolumeChart levelVolumeData={levelVolumeData} />
      <CommunityActivityCard communityActivity={communityActivity} />
    </div>
  );
}

function QuickActionsFooter() {
  const actions = [
    { label: "Deposit", icon: ArrowDownToLine },
    { label: "Staking", icon: Layers },
    { label: "Withdraw", icon: ArrowUpFromLine },
    { label: "Transfer", icon: ArrowLeftRight },
    { label: "NFT Market", icon: ImageIcon },
    { label: "Reports", icon: TrendingUp },
  ];

  return (
    <div className="mx-3 sm:mx-4 mb-4 card p-3">
      <p className="text-[10px] text-slate-500 mb-3 text-center">Quick Actions</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-2">
        {actions.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-9 h-9 rounded-lg border border-[#2a3458] flex items-center justify-center group-hover:border-violet-500/50 transition-colors">
              <Icon className="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
            </div>
            <span className="text-[9px] text-slate-500 text-center leading-tight">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mx-3 sm:mx-4 mb-6 pt-4 border-t border-[#1a2240]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="text-center sm:text-left">
          <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
            <BrandLogo size={28} />
            <span className="font-bold text-white text-sm">FORTUNE NFT</span>
          </div>
          <p className="text-[10px] text-slate-500 max-w-xs mx-auto sm:mx-0 leading-relaxed">
            Explore, collect, and trade unique Fortune NFTs on the most advanced
            blockchain platform.
          </p>
        </div>
        <div className="flex gap-2 justify-center sm:justify-end flex-shrink-0">
          {["X", "YT", "TG", "IG"].map((social) => (
            <button
              key={social}
              className="w-8 h-8 rounded-full bg-[#131a35] border border-[#1a2240] flex items-center justify-center text-[10px] text-slate-400 hover:text-white hover:border-violet-500/40 transition-colors"
            >
              {social}
            </button>
          ))}
        </div>
      </div>
      <p className="text-center text-[10px] text-slate-600">
        © 2026 Fortune NFT
      </p>
    </footer>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#070b1a] flex items-center justify-center p-4">
      <div className="card p-6 max-w-md w-full text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-white font-semibold mb-2">Failed to Load Dashboard</h2>
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#070b1a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
    </div>
  );
}

interface DashboardProps {
  data?: DashboardViewModel;
  error?: string;
  loadingSections?: Set<DashboardSectionId>;
  sectionErrors?: Partial<Record<DashboardSectionId, string>>;
  firstLevelCustomers?: FirstLevelCustomer[];
  selectedCustomerId?: string | null;
  customersLoading?: boolean;
  customersError?: string | null;
  onSelectCustomer?: (customerId: string | null) => void;
}

export default function Dashboard({
  data,
  error,
  loadingSections,
  sectionErrors,
  firstLevelCustomers = [],
  selectedCustomerId = null,
  customersLoading = false,
  customersError = null,
  onSelectCustomer,
}: DashboardProps) {
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const chartsLoading = loadingSections?.has("customer-stats");
  const purchaseLoading = loadingSections?.has("purchase-stats");
  const volumeLoading = loadingSections?.has("volume-by-level");
  const anyLoading = loadingSections && loadingSections.size > 0;

  return (
    <div className="min-h-screen bg-[#070b1a] overflow-x-hidden">
      <div className="max-w-7xl mx-auto pb-6">
        <Header
          customers={firstLevelCustomers}
          selectedCustomerId={selectedCustomerId}
          customersLoading={customersLoading}
          customersError={customersError}
          onSelectCustomer={onSelectCustomer ?? (() => {})}
        />
        {anyLoading && (
          <div className="mx-3 sm:mx-4 mb-3 card px-3 py-2 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin flex-shrink-0" />
            <p className="text-[10px] text-slate-400">
              Loading dashboard sections one at a time to reduce memory usage...
            </p>
          </div>
        )}
        {sectionErrors && Object.keys(sectionErrors).length > 0 && (
          <div className="mx-3 sm:mx-4 mb-3 card px-3 py-2 border-amber-500/20">
            <p className="text-[10px] text-amber-400">
              Some sections failed to load. The rest of the dashboard is still available.
            </p>
          </div>
        )}
        <ProfileBanner user={data.user} />
        <QuickActions />
        <StatsGrid
          metricsRow1={data.metricsRow1}
          metricsRow2={data.metricsRow2}
          loadingSections={loadingSections}
        />

        <LiveBusinessSection customerId={selectedCustomerId} />

        <div className="mx-3 sm:mx-4 mb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {chartsLoading ? (
            <>
              <SectionSkeleton label="Loading rank achievers..." />
              <SectionSkeleton label="Loading booster achievers..." />
            </>
          ) : (
            <>
              <RankAchieversCard rankAchievers={data.rankAchievers} />
              <BoosterAchieversCard boosterAchievers={data.boosterAchievers} />
            </>
          )}
          {purchaseLoading ? (
            <SectionSkeleton label="Loading NFT stats..." />
          ) : (
            <NFTDonutChart nftPriceData={data.nftPriceData} />
          )}
        </div>

        {volumeLoading ? (
          <div className="mx-3 sm:mx-4 mb-4">
            <SectionSkeleton label="Loading volume by level..." />
          </div>
        ) : (
          <VolumeLevelsStrip volumeLevels={data.volumeLevels} />
        )}
        <LazyRankProgressPanel
          key={`rank-progress-${selectedCustomerId ?? "self"}`}
          rankTabs={data.rankTabs}
          rankCriteriaSummary={data.rankCriteriaSummary}
          customerId={selectedCustomerId}
        />
        <BottomGrid
          levelVolumeData={data.levelVolumeData}
          communityActivity={data.communityActivity}
        />
        <QuickActionsFooter />
        <Footer />
      </div>
    </div>
  );
}
