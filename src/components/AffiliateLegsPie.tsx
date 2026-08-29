"use client";

import {
  fetchAffiliateByLegs,
  type AffiliateByLegsData,
  type AffiliateLeg,
} from "@/lib/affiliateByLegs";
import { formatMtht, formatNumber } from "@/lib/format";
import { Crown, Loader2, PieChart as PieIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const SLICE_COLORS = [
  "#fbbf24",
  "#38bdf8",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#fb923c",
  "#22d3ee",
  "#818cf8",
  "#e879f9",
  "#2dd4bf",
  "#f87171",
  "#60a5fa",
  "#c084fc",
  "#4ade80",
  "#facc15",
];

type PieSlice = {
  key: string;
  name: string;
  value: number;
  visual: number;
  percent: number;
  color: string;
  isPower: boolean;
};

function formatSharePercent(percent: number): string {
  if (!Number.isFinite(percent) || percent <= 0) return "0%";
  if (percent >= 100) return "100%";
  if (percent >= 10) return `${percent.toFixed(2)}%`;
  if (percent >= 1) return `${percent.toFixed(2)}%`;
  if (percent >= 0.01) return `${percent.toFixed(2)}%`;
  if (percent >= 0.001) return `${percent.toFixed(3)}%`;
  return "<0.001%";
}

function buildSlices(
  legs: AffiliateLeg[],
  powerLegId?: string
): PieSlice[] {
  const powerId = powerLegId ? String(powerLegId) : "";
  const total = legs.reduce((sum, leg) => sum + leg.totalAffiliate, 0);

  return [...legs]
    .sort((a, b) => b.totalAffiliate - a.totalAffiliate)
    .map((leg, index) => ({
      key: String(leg.legId || `${leg.name}-${index}`),
      name: leg.name,
      value: leg.totalAffiliate,
      percent: total > 0 ? (leg.totalAffiliate / total) * 100 : 0,
      color: SLICE_COLORS[index % SLICE_COLORS.length],
      isPower: !!powerId && String(leg.legId) === powerId,
      visual: 0,
    }));
}

function withVisibleWeights(slices: PieSlice[]): PieSlice[] {
  const items = slices.filter((slice) => slice.value > 0);
  if (items.length === 0) return [];

  const total = items.reduce((sum, slice) => sum + slice.value, 0);
  if (total <= 0) return items;

  const minShare = Math.min(0.05, 0.45 / items.length);
  const smallFlags = items.map((slice) => slice.value / total < minShare);
  const smallCount = smallFlags.filter(Boolean).length;
  const leftover = Math.max(0.4, 1 - smallCount * minShare);
  const largeTotal = items.reduce(
    (sum, slice, index) => (smallFlags[index] ? sum : sum + slice.value),
    0
  );

  return items.map((slice, index) => ({
    ...slice,
    visual: smallFlags[index]
      ? minShare
      : leftover * (slice.value / (largeTotal || slice.value)),
  }));
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PieSlice }>;
}) {
  if (!active || !payload?.[0]) return null;
  const slice = payload[0].payload;

  return (
    <div className="rounded-lg border border-[#1a2240] bg-[#0a0f24] px-3 py-2 shadow-xl">
      <p className="text-[11px] font-semibold text-white">{slice.name}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">
        {formatMtht(slice.value, true)} · {formatSharePercent(slice.percent)}
      </p>
    </div>
  );
}

export default function AffiliateLegsPie({
  customerId = null,
}: {
  customerId?: string | null;
}) {
  const [data, setData] = useState<AffiliateByLegsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  const load = useCallback(
    async (signal?: { cancelled: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchAffiliateByLegs(customerId);
        if (signal?.cancelled) return;
        setData(payload);
      } catch (err) {
        if (signal?.cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load affiliation by legs"
        );
      } finally {
        if (!signal?.cancelled) setLoading(false);
      }
    },
    [customerId]
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    setSelectedKey(null);
  }, [customerId]);

  useEffect(() => {
    if (!selectedKey) return;
    rowRefs.current.get(selectedKey)?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedKey]);

  const toggleSelected = useCallback((key: string) => {
    setSelectedKey((current) => (current === key ? null : key));
  }, []);

  const slices = useMemo(
    () =>
      buildSlices(data?.legs ?? [], data?.powerLeg?.legId),
    [data]
  );
  const pieSlices = useMemo(() => withVisibleWeights(slices), [slices]);

  const chartBody =
    loading && !data ? (
      <div className="flex flex-col items-center justify-center min-h-[220px] gap-2">
        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
        <p className="text-[10px] text-slate-500">Loading leg affiliation...</p>
      </div>
    ) : error && !data ? (
      <p className="text-xs text-red-400">{error}</p>
    ) : slices.length === 0 ? (
      <p className="text-xs text-slate-500 text-center py-16">
        No affiliation by legs yet
      </p>
    ) : (
      <div className="relative w-full max-w-[260px] aspect-square mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={
                pieSlices.length > 0
                  ? pieSlices
                  : [{ name: "None", value: 1, visual: 1, color: "#1a2240" }]
              }
              dataKey="visual"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="42%"
              outerRadius={(point: PieSlice) =>
                selectedKey && point.key === selectedKey ? "88%" : "78%"
              }
              paddingAngle={0.75}
              stroke="#070b1a"
              strokeWidth={2}
              onClick={(entry) => {
                const key = String(entry?.payload?.key ?? entry?.key ?? "");
                if (key) toggleSelected(key);
              }}
              style={{ cursor: "pointer", outline: "none" }}
            >
              {(pieSlices.length > 0
                ? pieSlices
                : [{ key: "empty", color: "#1a2240" }]
              ).map((slice) => {
                const selected = selectedKey === slice.key;
                const dimmed = !!selectedKey && !selected;
                return (
                  <Cell
                    key={slice.key}
                    fill={slice.color}
                    fillOpacity={dimmed ? 0.28 : 1}
                        stroke={selected ? "#ffffff" : "#070b1a"}
                        strokeWidth={selected ? 3 : 2}
                    style={{ cursor: "pointer", outline: "none" }}
                  />
                );
              })}
            </Pie>
            {pieSlices.length > 0 ? <Tooltip content={<PieTooltip />} /> : null}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[8px] text-slate-500">Total</span>
          <span className="text-[11px] font-bold text-white px-3 text-center leading-tight">
            {formatMtht(data?.totalAffiliate ?? 0, true)}
          </span>
        </div>
      </div>
    );

  const listBody =
    loading && !data ? (
      <div className="flex flex-col items-center justify-center min-h-[220px] gap-2">
        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
        <p className="text-[10px] text-slate-500">Loading legs...</p>
      </div>
    ) : error && !data ? (
      <p className="text-xs text-red-400">{error}</p>
    ) : slices.length === 0 ? (
      <p className="text-xs text-slate-500 text-center py-16">No legs yet</p>
    ) : (
      <div className="space-y-1 max-h-[280px] overflow-y-auto scrollbar-hide">
        {slices.map((slice) => {
          const selected = selectedKey === slice.key;
          return (
            <button
              key={slice.key}
              type="button"
              ref={(node) => {
                if (node) rowRefs.current.set(slice.key, node);
                else rowRefs.current.delete(slice.key);
              }}
              onClick={() => toggleSelected(slice.key)}
              className={`w-full grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-2 py-1.5 text-left transition-all ${
                selected ? "ring-1 ring-white/20" : "hover:bg-white/5"
              }`}
              style={
                selected
                  ? {
                      backgroundColor: `${slice.color}22`,
                      boxShadow: `inset 0 0 0 1px ${slice.color}`,
                    }
                  : undefined
              }
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: slice.color,
                    boxShadow: selected ? `0 0 8px ${slice.color}` : undefined,
                  }}
                />
                <span
                  className={`text-[10px] truncate ${
                    selected ? "text-white font-semibold" : "text-slate-300"
                  }`}
                >
                  {slice.name}
                </span>
                {slice.isPower ? (
                  <Crown className="w-3 h-3 text-amber-300 shrink-0" />
                ) : null}
              </span>
              <span className="flex items-center justify-end gap-2 shrink-0 whitespace-nowrap">
                <span className="text-[10px] text-white font-medium tabular-nums">
                  {formatMtht(slice.value, true)}
                </span>
                <span className="text-[10px] text-slate-500 w-14 text-right tabular-nums">
                  {formatSharePercent(slice.percent)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );

  return (
    <div className="mx-3 sm:mx-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <PieIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-slate-300">
              Affiliation by Leg
            </h3>
            {data?.powerLeg ? (
              <p className="text-[10px] text-amber-300/80 mt-0.5 truncate">
                Power leg: {data.powerLeg.name}
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 mt-0.5">
                Downline affiliation split across direct legs
              </p>
            )}
          </div>
        </div>
        {chartBody}
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-semibold text-slate-300">Leg values</h3>
          {data ? (
            <div className="text-right">
              <p className="text-[10px] text-slate-500">
                {formatNumber(data.totalLegs, 0)} legs
              </p>
              <p className="text-xs font-semibold text-white">
                {formatMtht(data.totalAffiliate, true)}
              </p>
            </div>
          ) : null}
        </div>
        {listBody}
      </div>
    </div>
  );
}
