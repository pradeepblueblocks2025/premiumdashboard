"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  ArrowLeftRight,
  Wallet,
  Users,
  Coins,
  TrendingUp,
  Gift,
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
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import type {
  BoosterAchieverData,
  DashboardViewModel,
  FirstLevelCustomer,
  LegsProgress,
  MetricCardData,
  NftPriceChartData,
  PremiumDashboardData,
  RankAchieverData,
  RankProgressItem,
  UserProfile,
} from "@/lib/types";
import {
  barColorFromApi,
  isLegsProgress,
  isVolumeProgress,
  legStatusClasses,
  rankTabStatusClasses,
  resolveSelfStaking,
} from "@/lib/transformers";
import { executiveAvatarUrl } from "@/lib/avatar";
import { formatUsd, progressPercent } from "@/lib/format";
import { fetchBackendJson } from "@/lib/clientApi";
import { mergeRankDetail } from "@/lib/api";
import { clearStoredToken } from "@/lib/auth";
import { withCustomerId } from "@/lib/format";
import { useRouter } from "next/navigation";
import type { DashboardSectionId } from "@/lib/dashboardSections";
import BrandLogo from "@/components/BrandLogo";
import CustomerSwitcher from "@/components/CustomerSwitcher";
import AffiliateSection from "@/components/AffiliateSection";
import AffiliateLegsPie from "@/components/AffiliateLegsPie";
import AccountStatusPanel from "@/components/AccountStatusPanel";
import LiveBusinessSection from "@/components/LiveBusinessSection";

const metricIcons: Record<string, React.ReactNode> = {
  users: <Users className="w-4 h-4 text-violet-400" />,
  affiliate: <Gift className="w-4 h-4 text-pink-400" />,
  staking: <Layers className="w-4 h-4 text-emerald-400" />,
  withdraw: <ArrowUpFromLine className="w-4 h-4 text-orange-400" />,
  transfer: <ArrowLeftRight className="w-4 h-4 text-blue-400" />,
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
      </div>
    </header>
  );
}

function ProfileBanner({
  user,
  customerId = null,
}: {
  user: UserProfile;
  customerId?: string | null;
}) {
  const [showBalance, setShowBalance] = useState(true);
  const [avatarSrc, setAvatarSrc] = useState(user.avatar);

  useEffect(() => {
    setAvatarSrc(user.avatar);
  }, [user.avatar]);

  return (
    <div className="mx-3 sm:mx-4 mb-4 rounded-xl overflow-hidden border border-[#1a2240] grid-bg bg-[#0a0f24]">
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <div className="flex items-stretch min-w-0 flex-1">
          <div className="relative w-[5.75rem] sm:w-32 flex-shrink-0 self-stretch min-h-[7.5rem] bg-[#1a2240]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarSrc}
              alt={user.name}
              className={`absolute inset-0 w-full h-full object-center bg-[#1a2240] ${
                avatarSrc.includes("dicebear.com") ? "object-contain" : "object-cover"
              }`}
              onError={() => {
                const fallback = executiveAvatarUrl(user.email || user.name);
                if (avatarSrc !== fallback) setAvatarSrc(fallback);
              }}
            />
            <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0a0f24]">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0 p-3 sm:p-4">
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
        <div className="px-3 pb-3 pt-2 sm:p-4 sm:pl-0 sm:pt-4 sm:min-w-[220px] sm:max-w-sm sm:self-stretch">
          <AccountStatusPanel
            key={customerId ?? "self"}
            customerId={customerId}
          />
        </div>
      </div>
    </div>
  );
}

const FORTUNE_APP_LINKS = {
  deposit: "https://fortunenft.world/user/deposit",
  withdrawal: "https://fortunenft.world/user/withdrawal",
  staking: "https://fortunenft.world/user/staking",
  swap: "https://fortunenft.world/user/swap",
  wallet: "https://fortunenft.world/user/wallet",
  fundtransfer: "https://fortunenft.world/user/fundtransfer",
} as const;

function QuickActions() {
  const actions = [
    { label: "Deposit", icon: ArrowDownToLine, href: FORTUNE_APP_LINKS.deposit },
    { label: "Withdraw", icon: ArrowUpFromLine, href: FORTUNE_APP_LINKS.withdrawal },
    { label: "Staking", icon: Layers, href: FORTUNE_APP_LINKS.staking },
    { label: "Swap", icon: ArrowLeftRight, href: FORTUNE_APP_LINKS.swap },
    { label: "Wallet", icon: Wallet, href: FORTUNE_APP_LINKS.wallet },
  ];

  return (
    <div className="mb-4 overflow-x-auto scrollbar-hide">
      <div className="flex sm:grid sm:grid-cols-5 gap-2 px-3 sm:px-4 min-w-max sm:min-w-0">
        {actions.map(({ label, icon: Icon, href }) => (
          <a
            key={label}
            href={href}
            className="flex-shrink-0 w-[4.5rem] sm:w-auto flex flex-col items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl bg-[#0d1228] border border-[#1a2240] hover:border-violet-500/40 hover:bg-[#131a35] transition-all group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#131a35] border border-[#2a3458] flex items-center justify-center group-hover:border-violet-500/50 transition-colors">
              <Icon className="w-4 h-4 text-slate-300" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
              {label}
            </span>
          </a>
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
  loadingSections,
}: {
  metricsRow1: MetricCardData[];
  loadingSections?: Set<string>;
}) {
  const communityLoading = loadingSections?.has("community-users");
  const financialLoading = loadingSections?.has("financial-stats");

  const row1Loading = [
    communityLoading,
    financialLoading,
    financialLoading,
    financialLoading,
  ];

  return (
    <div className="mx-3 sm:mx-4 mb-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {metricsRow1.map((m, i) => (
          <MetricCard key={m.title} {...m} loading={row1Loading[i]} />
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
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [hoveredRange, setHoveredRange] = useState<string | null>(null);
  const total = nftPriceData.reduce((s, d) => s + d.count, 0);
  const activeRange = hoveredRange ?? selectedRange;
  const active = nftPriceData.find((item) => item.range === activeRange);

  function toggleRange(range: string) {
    setSelectedRange((current) => (current === range ? null : range));
  }

  function rangeFromPieEvent(entry: { payload?: NftPriceChartData }) {
    return entry.payload?.range ?? "";
  }

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
        <div className="relative w-32 h-32 sm:w-28 sm:h-28 flex-shrink-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={nftPriceData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={(entry: NftPriceChartData) =>
                  activeRange && entry.range === activeRange ? 58 : 52
                }
                paddingAngle={2}
                dataKey="valueUsd"
                onClick={(entry) => {
                  const range = rangeFromPieEvent(entry);
                  if (range) toggleRange(range);
                }}
                onMouseEnter={(entry) => {
                  const range = rangeFromPieEvent(entry);
                  if (range) setHoveredRange(range);
                }}
                onMouseLeave={() => setHoveredRange(null)}
                style={{ cursor: "pointer", outline: "none" }}
              >
                {nftPriceData.map((entry) => {
                  const highlighted = activeRange === entry.range;
                  const dimmed = !!activeRange && !highlighted;
                  return (
                    <Cell
                      key={entry.range}
                      fill={entry.color}
                      fillOpacity={dimmed ? 0.28 : 1}
                      stroke={highlighted ? "#ffffff" : "#0a0f24"}
                      strokeWidth={highlighted ? 2 : 1}
                      style={{ cursor: "pointer", outline: "none" }}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-3 overflow-hidden">
            {active ? (
              <>
                <span className="text-[10px] sm:text-xs font-bold text-cyan-300 leading-none">
                  {formatUsd(active.valueUsd, true)}
                </span>
                <span className="text-[8px] text-slate-500 mt-0.5 leading-none">
                  {active.count.toLocaleString()} · {active.percent}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[8px] text-slate-500 leading-none">Total NFTs</span>
                <span className="text-[10px] sm:text-xs font-bold text-white leading-none mt-0.5">
                  {total.toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="w-full sm:flex-1 space-y-1">
          {nftPriceData.map(({ range, count, percent, color, valueUsd }) => {
            const isSelected = selectedRange === range;
            const isActive = activeRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => toggleRange(range)}
                onMouseEnter={() => setHoveredRange(range)}
                onMouseLeave={() => setHoveredRange(null)}
                className="w-full flex items-center gap-1.5 min-w-0 rounded-md px-1 py-0.5 text-left transition-all"
                style={
                  isSelected
                    ? {
                        backgroundColor: `${color}22`,
                        boxShadow: `inset 0 0 0 1px ${color}`,
                      }
                    : isActive
                      ? { backgroundColor: `${color}14` }
                      : undefined
                }
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: color,
                    boxShadow: isActive ? `0 0 6px ${color}` : undefined,
                  }}
                />
                <span
                  className={`text-[9px] flex-1 truncate ${
                    isActive ? "text-white font-semibold" : "text-slate-400"
                  }`}
                >
                  {range}
                </span>
                <span className="text-[9px] text-white font-medium flex-shrink-0">
                  {isActive
                    ? formatUsd(valueUsd, true)
                    : count.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-500 w-10 text-right flex-shrink-0">
                  {percent}%
                </span>
              </button>
            );
          })}
        </div>
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

function SelfStakingRequirement({ rank }: { rank: RankProgressItem }) {
  const staking = resolveSelfStaking(rank);
  const percent = progressPercent(staking.currentUsd, staking.targetUsd);

  return (
    <div className="p-3 rounded-lg bg-[#131a35] border border-[#1a2240]">
      <div className="flex justify-between mb-1.5">
        <span className="text-[10px] text-slate-400">Active Self Staking</span>
        <span
          className={`text-[10px] ${staking.achieved ? "text-emerald-400" : "text-slate-400"}`}
        >
          {percent}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#1a2240] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColorFromApi(staking.color, staking.achieved)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5 gap-2">
        <p className="text-[9px] text-slate-600">
          {formatUsd(staking.currentUsd)} / {formatUsd(staking.targetUsd)}
        </p>
        <span
          className={`text-[9px] ${staking.achieved ? "text-emerald-400" : "text-amber-400"}`}
        >
          {staking.achieved
            ? "Achieved"
            : staking.remainingUsd > 0
              ? `Need ${formatUsd(staking.remainingUsd)} more`
              : "Needed"}
        </span>
      </div>
      <p className="text-[9px] text-slate-600 mt-1">
        Your own active NFT purchases, summed by amount (USD)
      </p>
    </div>
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
      <SelfStakingRequirement rank={rank} />
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
      <SelfStakingRequirement rank={rank} />

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
    <div>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-500">{activeRank.criteria}</p>
                <RankStatusBadge status={activeRank.status} />
              </div>
              <SelfStakingRequirement rank={activeRank} />
              <p className="text-xs text-slate-500">
                Complete previous ranks to unlock leg details for this rank.
              </p>
            </div>
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
  customerId = null,
}: {
  rankTabs: string[];
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
    <div className="mx-3 sm:mx-4 mb-4 card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="w-full px-3 sm:px-4 py-3 flex items-center justify-between gap-3 text-left border-b border-[#1a2240] hover:bg-violet-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-slate-200">
            Rank Achievement Criteria
          </span>
        </div>
        <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
      </button>

      {loading && !rankProgress ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          <p className="text-[10px] text-slate-500">Loading rank progress...</p>
        </div>
      ) : error && !rankProgress ? (
        <div className="p-4">
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
        <RankCriteriaSection
          rankTabs={rankTabs}
          rankProgress={rankProgress}
          customerId={customerId}
        />
      )}
    </div>
  );
}

const LEVEL_VOLUME_PALETTE = [
  { from: "#22d3ee", to: "#6366f1" },
  { from: "#a78bfa", to: "#ec4899" },
  { from: "#818cf8", to: "#06b6d4" },
  { from: "#f472b6", to: "#fb923c" },
  { from: "#34d399", to: "#22d3ee" },
] as const;

function LevelVolumeChart({
  levelVolumeData,
}: {
  levelVolumeData: DashboardViewModel["levelVolumeData"];
}) {
  const max = Math.max(...levelVolumeData.map((row) => row.value), 1);
  const total = levelVolumeData.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="card volume-modern-card p-4 flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-xs font-semibold text-slate-200">
          Level Volume Overview
        </h3>
        <span className="text-[10px] text-slate-500">
          Total {formatUsd(total, true)}
        </span>
      </div>
      <div className="flex flex-col gap-3.5">
        {levelVolumeData.map((row, index) => {
          const palette =
            LEVEL_VOLUME_PALETTE[index % LEVEL_VOLUME_PALETTE.length];
          const width = Math.max(8, (row.value / max) * 100);
          const share = total > 0 ? Math.round((row.value / total) * 100) : 0;
          const levelNo = row.level.replace(/\D/g, "") || String(index + 1);

          return (
            <div key={row.level} className="flex items-center gap-3">
              <div
                className="volume-modern-badge shrink-0"
                style={{
                  background: `linear-gradient(145deg, ${palette.from}33, ${palette.to}1a)`,
                  boxShadow: `0 0 14px ${palette.to}33`,
                }}
              >
                L{levelNo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">{row.level}</span>
                  <span className="text-[10px] tabular-nums text-slate-500">
                    {share}%
                  </span>
                </div>
                <div className="volume-modern-track">
                  <div
                    className="volume-modern-fill"
                    style={{
                      width: `${width}%`,
                      background: `linear-gradient(90deg, ${palette.from}, ${palette.to})`,
                      boxShadow: `0 0 18px ${palette.to}55`,
                      animationDelay: `${index * 80}ms`,
                    }}
                  >
                    <span className="volume-modern-shine" />
                    <span
                      className="volume-modern-pip"
                      style={{ boxShadow: `0 0 10px ${palette.to}` }}
                    />
                  </div>
                </div>
              </div>
              <span className="w-[4.5rem] shrink-0 text-right text-[11px] font-semibold tabular-nums text-white">
                {formatUsd(row.value, true)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BottomGrid({
  levelVolumeData,
}: {
  levelVolumeData: DashboardViewModel["levelVolumeData"];
}) {
  return (
    <div className="mx-3 sm:mx-4 mb-4">
      <LevelVolumeChart levelVolumeData={levelVolumeData} />
    </div>
  );
}

function QuickActionsFooter() {
  const actions = [
    { label: "Deposit", icon: ArrowDownToLine, href: FORTUNE_APP_LINKS.deposit },
    { label: "Staking", icon: Layers, href: FORTUNE_APP_LINKS.staking },
    { label: "Withdraw", icon: ArrowUpFromLine, href: FORTUNE_APP_LINKS.withdrawal },
    { label: "Transfer", icon: ArrowLeftRight, href: FORTUNE_APP_LINKS.fundtransfer },
    { label: "NFT Market", icon: ImageIcon },
    { label: "Reports", icon: TrendingUp },
  ];

  return (
    <div className="mx-3 sm:mx-4 mb-4 card p-3">
      <p className="text-[10px] text-slate-500 mb-3 text-center">Quick Actions</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-2">
        {actions.map(({ label, icon: Icon, href }) => {
          const className = "flex flex-col items-center gap-1.5 group";
          const content = (
            <>
              <div className="w-9 h-9 rounded-lg border border-[#2a3458] flex items-center justify-center group-hover:border-violet-500/50 transition-colors">
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
              </div>
              <span className="text-[9px] text-slate-500 text-center leading-tight">
                {label}
              </span>
            </>
          );

          if (href) {
            return (
              <a key={label} href={href} className={className}>
                {content}
              </a>
            );
          }

          return (
            <button key={label} type="button" className={className}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SOCIAL_LINKS = [
  {
    label: "X",
    href: "https://x.com/",
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.726-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/",
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.55 12 3.55 12 3.55s-7.54 0-9.38.5A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.84.5 9.38.5 9.38.5s7.54 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.57V8.43L15.84 12l-6.09 3.57z" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "https://t.me/",
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
        <path d="M21.43 4.22c.24-.99-.73-1.8-1.68-1.43L2.47 9.37c-1.06.4-1.05 1.9.02 2.27l4.4 1.52 1.67 5.3c.24.76 1.18.98 1.73.4l2.42-2.56 4.62 3.4c.86.63 2.08.16 2.28-.88l2.82-14.6zM9.2 13.96l8.3-5.17c.18-.11.37.13.22.27l-6.7 6.4-.3 3.38-1.52-4.88z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
        <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9zm9.25 1.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      </svg>
    ),
  },
] as const;

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
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              title={social.label}
              aria-label={social.label}
              className="w-8 h-8 rounded-full bg-[#131a35] border border-[#1a2240] flex items-center justify-center text-slate-400 hover:text-white hover:border-violet-500/40 transition-colors"
            >
              {social.icon}
            </a>
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
              Syncing your latest dashboard data...
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
        <ProfileBanner user={data.user} customerId={selectedCustomerId} />
        <QuickActions />
        <StatsGrid
          metricsRow1={data.metricsRow1}
          loadingSections={loadingSections}
        />

        <LiveBusinessSection customerId={selectedCustomerId} />
        <AffiliateSection customerId={selectedCustomerId} />
        <AffiliateLegsPie
          key={`affiliate-legs-${selectedCustomerId ?? "self"}`}
          customerId={selectedCustomerId}
        />

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

        <LazyRankProgressPanel
          key={`rank-progress-${selectedCustomerId ?? "self"}`}
          rankTabs={data.rankTabs}
          customerId={selectedCustomerId}
        />
        <BottomGrid levelVolumeData={data.levelVolumeData} />
        <QuickActionsFooter />
        <Footer />
      </div>
    </div>
  );
}
