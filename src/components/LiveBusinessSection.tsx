"use client";

import { fetchLiveBusiness } from "@/lib/liveBusiness";
import { formatMtht, formatNumber, formatUsd } from "@/lib/format";
import {
  playNewBusinessSound,
  unlockNotificationAudio,
} from "@/lib/notifySound";
import type { LiveBusinessData, LiveBusinessRange } from "@/lib/types";
import { Activity, ImageIcon, Loader2, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const POLL_MS = 30_000;

const RANGES: Array<{ id: LiveBusinessRange; label: string }> = [
  { id: "7days", label: "7 Days" },
  { id: "month", label: "Month" },
];

function DayValueLabel({
  x,
  y,
  value,
  index,
  dense,
}: {
  x?: number | string;
  y?: number | string;
  value?: string | number | null;
  index?: number;
  dense?: boolean;
}) {
  const px = typeof x === "number" ? x : Number(x);
  const py = typeof y === "number" ? y : Number(y);
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(amount)) {
    return null;
  }

  const offset = dense && (index ?? 0) % 2 === 1 ? 16 : -8;

  return (
    <text
      x={px}
      y={py + offset}
      textAnchor="middle"
      fill="#ddd6fe"
      fontSize={dense ? 8 : 10}
      fontWeight={600}
    >
      {formatNumber(amount, 0, true)}
    </text>
  );
}

function StatRow({
  label,
  data,
}: {
  label: string;
  data?: LiveBusinessData | null;
}) {
  if (!data) return null;

  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-t border-[#1a2240]">
      <span className="text-[11px] text-slate-400 mt-0.5">{label}</span>
      <div className="text-right">
        <p className="text-xs font-semibold text-white">
          {formatMtht(data.summary.totalMtht, true)}
        </p>
        <p className="text-[10px] text-slate-500">
          {formatUsd(data.summary.totalUsdt, true)} ·{" "}
          {formatNumber(data.summary.totalNftPurchased, 0)} NFTs
        </p>
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
  const [today, setToday] = useState<LiveBusinessData | null>(null);
  const [week, setWeek] = useState<LiveBusinessData | null>(null);
  const [month, setMonth] = useState<LiveBusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justNotified, setJustNotified] = useState(false);
  const previousBusiness = useRef<{
    customerId: string | null;
    mtht: number;
    usdt: number;
    nft: number;
  } | null>(null);

  const load = useCallback(
    async (silent = false, signal?: { cancelled: boolean }) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const [todayData, weekData, monthData] = await Promise.all([
          fetchLiveBusiness(undefined, customerId),
          fetchLiveBusiness("7days", customerId),
          fetchLiveBusiness("month", customerId),
        ]);

        if (signal?.cancelled) return;

        const next = {
          customerId,
          mtht: todayData.summary.totalMtht,
          usdt: todayData.summary.totalUsdt,
          nft: todayData.summary.totalNftPurchased,
        };
        const prev = previousBusiness.current;
        const isNewBusiness =
          !!prev &&
          prev.customerId === customerId &&
          (next.nft > prev.nft || next.mtht > prev.mtht || next.usdt > prev.usdt);

        if (isNewBusiness) {
          void playNewBusinessSound();
          setJustNotified(true);
          window.setTimeout(() => setJustNotified(false), 2500);
        }
        previousBusiness.current = next;

        setToday(todayData);
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
    },
    [customerId]
  );

  useEffect(() => {
    previousBusiness.current = null;
  }, [customerId]);

  useEffect(() => {
    const unlock = () => {
      void unlockNotificationAudio();
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

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

  const chart = range === "month" ? month : week;
  const series = chart?.series ?? [];
  const denseLabels = range === "month";

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
          <span
            className={`inline-flex items-center gap-1 text-[10px] ${
              justNotified ? "text-amber-300" : "text-emerald-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                justNotified ? "bg-amber-300" : "bg-emerald-400"
              } animate-pulse`}
            />
            {justNotified ? "NEW" : "LIVE"}
          </span>
        </div>

        {loading && !today ? (
          <div className="flex flex-col items-center justify-center min-h-[140px] gap-2">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            <p className="text-[10px] text-slate-500">Loading business...</p>
          </div>
        ) : error && !today ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : (
          <>
            <p className="text-[10px] text-slate-500 mb-1">Today</p>
            <p
              className={`text-2xl font-bold break-all ${
                justNotified ? "text-amber-300" : "gradient-text"
              }`}
            >
              {formatMtht(today?.summary.totalMtht ?? 0)}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-400">
              <span>{formatUsd(today?.summary.totalUsdt ?? 0)}</span>
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {formatNumber(today?.summary.totalNftPurchased ?? 0, 0)} NFTs
              </span>
            </div>
            <div className="mt-4">
              <StatRow label="7 Days" data={week} />
              <StatRow label="This Month" data={month} />
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
          <div className="flex flex-col items-center justify-center min-h-[220px] gap-2">
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
          <div className="h-[240px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={series}
                margin={{ top: 22, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="#1a2240"
                  strokeDasharray="3 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: denseLabels ? 8 : 10 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={denseLabels ? 8 : 16}
                  interval={denseLabels ? 1 : 0}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                  tickFormatter={(value: number) => formatNumber(value, 0, true)}
                />
                <Line
                  type="monotone"
                  dataKey="mtht"
                  stroke="#8b5cf6"
                  strokeWidth={7}
                  strokeOpacity={0.18}
                  dot={false}
                  isAnimationActive={false}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="mtht"
                  stroke="#c4b5fd"
                  strokeWidth={2.5}
                  dot={{
                    r: denseLabels ? 3 : 4.5,
                    fill: "#8b5cf6",
                    stroke: "#ede9fe",
                    strokeWidth: 1.5,
                  }}
                  activeDot={{ r: 6, fill: "#a78bfa", stroke: "#fff" }}
                >
                  <LabelList
                    dataKey="mtht"
                    content={(props) => (
                      <DayValueLabel
                        x={typeof props.x === "number" ? props.x : undefined}
                        y={typeof props.y === "number" ? props.y : undefined}
                        value={
                          typeof props.value === "number" ||
                          typeof props.value === "string"
                            ? props.value
                            : undefined
                        }
                        index={props.index}
                        dense={denseLabels}
                      />
                    )}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
