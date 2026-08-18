"use client";

import { fetchLiveBusiness } from "@/lib/liveBusiness";
import { formatMtht, formatUsd } from "@/lib/format";
import type { LiveBusinessData, LiveBusinessRange } from "@/lib/types";
import { Activity, Loader2, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const POLL_MS = 30_000;

const RANGES: Array<{ id: LiveBusinessRange; label: string }> = [
  { id: "7days", label: "7 Days" },
  { id: "month", label: "Month" },
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const usd = payload.find((item) => item.dataKey === "usd")?.value ?? 0;
  const mtht = payload.find((item) => item.dataKey === "mtht")?.value ?? 0;

  return (
    <div className="rounded-lg bg-[#0d1228] border border-[#1a2240] px-2.5 py-2 shadow-lg">
      <p className="text-[10px] text-slate-400 mb-1">{label}</p>
      <p className="text-xs font-semibold text-white">{formatUsd(usd)}</p>
      {mtht > 0 && (
        <p className="text-[10px] text-slate-400">{formatMtht(mtht)}</p>
      )}
    </div>
  );
}

function StatRow({
  label,
  usd,
  mtht,
}: {
  label: string;
  usd?: number;
  mtht?: number;
}) {
  if (usd === undefined && mtht === undefined) return null;

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-t border-[#1a2240]">
      <span className="text-[11px] text-slate-400">{label}</span>
      <div className="text-right">
        <p className="text-xs font-semibold text-white">
          {formatUsd(usd ?? 0, true)}
        </p>
        {mtht !== undefined && mtht > 0 && (
          <p className="text-[10px] text-slate-500">{formatMtht(mtht, true)}</p>
        )}
      </div>
    </div>
  );
}

export default function LiveBusinessSection({
  customerId = null,
}: {
  customerId?: string | null;
}) {
  const [range, setRange] = useState<LiveBusinessRange>("7days");
  const [summary, setSummary] = useState<LiveBusinessData | null>(null);
  const [chart, setChart] = useState<LiveBusinessData | null>(null);
  const [week, setWeek] = useState<LiveBusinessData | null>(null);
  const [month, setMonth] = useState<LiveBusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false, signal?: { cancelled: boolean }) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const [live, weekData, monthData] = await Promise.all([
        fetchLiveBusiness(undefined, customerId),
        fetchLiveBusiness("7days", customerId),
        fetchLiveBusiness("month", customerId),
      ]);

      if (signal?.cancelled) return;

      setSummary(live);
      setWeek(weekData);
      setMonth(monthData);
    } catch (err) {
      if (signal?.cancelled) return;
      setError(
        err instanceof Error ? err.message : "Failed to load live business"
      );
    } finally {
      if (!signal?.cancelled && !silent) setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    const signal = { cancelled: false };

    void load(false, signal);

    const timer = window.setInterval(() => {
      if (!signal.cancelled) void load(true, signal);
    }, POLL_MS);

    return () => {
      signal.cancelled = true;
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    setChart(range === "month" ? month : week);
  }, [range, month, week]);

  const heroUsd = summary?.summary.todayUsd ?? summary?.summary.totalUsd ?? 0;
  const heroMtht = summary?.summary.todayMtht ?? summary?.summary.totalMtht ?? 0;
  const series = chart?.series ?? [];

  return (
    <div className="mx-3 sm:mx-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
            <h3 className="text-xs font-semibold text-slate-300">
              Community Business
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>

        {loading && !summary ? (
          <div className="flex flex-col items-center justify-center min-h-[140px] gap-2">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            <p className="text-[10px] text-slate-500">Loading business...</p>
          </div>
        ) : error && !summary ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : (
          <>
            <p className="text-[10px] text-slate-500 mb-1">Live business</p>
            <p className="text-2xl font-bold gradient-text break-all">
              {formatUsd(heroUsd)}
            </p>
            {heroMtht > 0 && (
              <p className="text-xs text-slate-400 mt-1">{formatMtht(heroMtht)}</p>
            )}
            <div className="mt-4">
              <StatRow
                label="Today"
                usd={summary?.summary.todayUsd ?? summary?.summary.totalUsd}
                mtht={summary?.summary.todayMtht ?? summary?.summary.totalMtht}
              />
              <StatRow
                label="7 Days"
                usd={week?.summary.totalUsd ?? week?.summary.weekUsd}
                mtht={week?.summary.totalMtht ?? week?.summary.weekMtht}
              />
              <StatRow
                label="This Month"
                usd={month?.summary.totalUsd ?? month?.summary.monthUsd}
                mtht={month?.summary.totalMtht ?? month?.summary.monthMtht}
              />
              {summary?.summary.count !== undefined && (
                <div className="flex items-center justify-between gap-3 py-1.5 border-t border-[#1a2240]">
                  <span className="text-[11px] text-slate-400">Orders</span>
                  <p className="text-xs font-semibold text-white">
                    {summary.summary.count}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-300 truncate">
              Live Community Business
            </h3>
          </div>
          <div className="flex rounded-lg bg-[#131a35] border border-[#1a2240] p-0.5">
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id)}
                className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
                  range === item.id
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading && !chart ? (
          <div className="flex flex-col items-center justify-center min-h-[180px] gap-2">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            <p className="text-[10px] text-slate-500">Loading graph...</p>
          </div>
        ) : error && !chart ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : series.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-16">
            No live community business yet
          </p>
        ) : (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="liveBusinessFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={22}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                  tickFormatter={(value: number) => formatUsd(value, true)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="usd"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#liveBusinessFill)"
                  name="Business"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
