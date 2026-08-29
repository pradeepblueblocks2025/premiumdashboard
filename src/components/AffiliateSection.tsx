"use client";

import {
  calendarMonthRange,
  clipSeriesThroughToday,
  fillDailySeries,
} from "@/lib/liveBusiness";
import {
  fetchCustomerAffiliateEarned,
  type AffiliateEarnedData,
  type AffiliatePeriodSummary,
} from "@/lib/affiliateEarned";
import { formatMtht, formatNumber, formatUsd } from "@/lib/format";
import type { LiveBusinessPoint, LiveBusinessRange } from "@/lib/types";
import {
  Activity,
  CalendarDays,
  CalendarRange,
  History,
  Loader2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PremiumAffiliateChart from "@/components/PremiumAffiliateChart";

const POLL_MS = 30_000;

const RANGES: Array<{ id: LiveBusinessRange; label: string }> = [
  { id: "7days", label: "7 Days" },
  { id: "month", label: "Month" },
];

function shareOfMonth(part: number, month: number): number {
  if (month <= 0) return 0;
  return Math.min(100, Math.round((part / month) * 100));
}

function PeriodTile({
  label,
  icon: Icon,
  period,
}: {
  label: string;
  icon: typeof CalendarDays;
  period?: AffiliatePeriodSummary | null;
}) {
  if (!period) return null;

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-[#0a1520] px-3 py-2.5 xl:flex-col xl:items-start">
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className="w-3 h-3 text-sky-400 shrink-0" />
        <span className="text-[10px] uppercase tracking-wider text-sky-300/80 whitespace-nowrap">
          {label}
        </span>
      </div>
      <div className="text-right xl:text-left min-w-0">
        <p className="text-sm font-semibold text-white">
          {formatMtht(period.totalMtht, true)}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {formatUsd(period.totalUsdt, true)}
        </p>
        <p className="text-[10px] text-sky-200/70 mt-0.5">
          {formatNumber(period.count, 0)} Affiliates
        </p>
      </div>
    </div>
  );
}

export default function AffiliateSection({
  customerId = null,
}: {
  customerId?: string | null;
}) {
  const [range, setRange] = useState<LiveBusinessRange>("7days");
  const [data, setData] = useState<AffiliateEarnedData | null>(null);
  const [monthSeries, setMonthSeries] = useState<LiveBusinessPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false, signal?: { cancelled: boolean }) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const [payload, monthPayload, yesterdayPayload] = await Promise.all([
          fetchCustomerAffiliateEarned(customerId, "7days"),
          fetchCustomerAffiliateEarned(customerId, "month"),
          fetchCustomerAffiliateEarned(customerId, "yesterday"),
        ]);
        if (signal?.cancelled) return;
        setData({
          ...payload,
          yesterday: yesterdayPayload.yesterday,
        });
        setMonthSeries(monthPayload.series);
      } catch (err) {
        if (signal?.cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load my affiliation"
        );
      } finally {
        if (!signal?.cancelled && !silent) setLoading(false);
      }
    },
    [customerId]
  );

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

  const weekSeries = clipSeriesThroughToday(data?.series ?? []).slice(-7);
  const monthBounds = calendarMonthRange();
  const monthChart = fillDailySeries(
    monthSeries,
    monthBounds.start,
    monthBounds.end
  );
  const series = range === "month" ? monthChart : weekSeries;
  const denseLabels = range === "month";

  return (
    <div className="mx-3 sm:mx-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="card p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-3.5 h-3.5 text-sky-300" />
            <h3 className="text-xs font-semibold text-slate-300 truncate">
              MY AFFILIATION
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
                    ? "bg-sky-500/15 text-sky-200"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] gap-2">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            <p className="text-[10px] text-slate-500">Loading graph...</p>
          </div>
        ) : error && !data ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : series.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-16">
            No affiliation yet
          </p>
        ) : (
          <PremiumAffiliateChart
            key={`${range}-${series.length}`}
            series={series}
            dense={denseLabels}
          />
        )}
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-sky-300" />
            <h3 className="text-xs font-semibold text-slate-300">
              MY AFFILIATION
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center min-h-[140px] gap-2">
            <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
            <p className="text-[10px] text-slate-500">Loading affiliations...</p>
          </div>
        ) : error && !data ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : (
          <>
            <div className="rounded-xl bg-[#0a1520] px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-sky-300/80">
                Today
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold break-all text-sky-100">
                {formatMtht(data?.today.totalMtht ?? 0)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <span>{formatUsd(data?.today.totalUsdt ?? 0)}</span>
                <span className="inline-flex items-center gap-1 text-sky-200/80">
                  <Users className="w-3 h-3" />
                  {formatNumber(data?.today.count ?? 0, 0)} Affiliates
                </span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-sky-500/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300"
                  style={{
                    width: `${shareOfMonth(
                      data?.today.totalMtht ?? 0,
                      data?.month.totalMtht ?? 0
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500">
                {shareOfMonth(
                  data?.today.totalMtht ?? 0,
                  data?.month.totalMtht ?? 0
                )}
                % of this month
              </p>
            </div>

            <div className="mt-3 grid grid-cols-1 xl:grid-cols-3 gap-2">
              <PeriodTile
                label="Yesterday"
                icon={History}
                period={data?.yesterday}
              />
              <PeriodTile
                label="7 Days"
                icon={CalendarRange}
                period={data?.week}
              />
              <PeriodTile
                label="This Month"
                icon={CalendarDays}
                period={data?.month}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
