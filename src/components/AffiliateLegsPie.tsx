"use client";

import {
  fetchAffiliateByLegs,
  type AffiliateByLegsData,
  type AffiliateLeg,
} from "@/lib/affiliateByLegs";
import { formatMtht, formatNumber } from "@/lib/format";
import { Crown, Loader2, PieChart as PieIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  percent: number;
  color: string;
  isPower: boolean;
};

function buildSlices(
  legs: AffiliateLeg[],
  total: number,
  powerLegId?: string
): PieSlice[] {
  const powerId = powerLegId ? String(powerLegId) : "";

  return [...legs]
    .sort((a, b) => b.totalAffiliate - a.totalAffiliate)
    .map((leg, index) => ({
      key: String(leg.legId || `${leg.name}-${index}`),
      name: leg.name,
      value: leg.totalAffiliate,
      percent: total > 0 ? (leg.totalAffiliate / total) * 100 : 0,
      color: SLICE_COLORS[index % SLICE_COLORS.length],
      isPower: !!powerId && String(leg.legId) === powerId,
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
        {formatMtht(slice.value, true)} · {slice.percent.toFixed(1)}%
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

  const slices = useMemo(
    () =>
      buildSlices(
        data?.legs ?? [],
        data?.totalAffiliate ?? 0,
        data?.powerLeg?.legId
      ),
    [data]
  );
  const pieSlices = useMemo(
    () => slices.filter((slice) => slice.value > 0),
    [slices]
  );

  return (
    <div className="mx-3 sm:mx-4 mb-4 card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
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
        {data ? (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-500">
              {formatNumber(data.totalLegs, 0)} legs
            </p>
            <p className="text-xs font-semibold text-white">
              {formatMtht(data.totalAffiliate, true)}
            </p>
          </div>
        ) : null}
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center min-h-[180px] gap-2">
          <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          <p className="text-[10px] text-slate-500">Loading leg affiliation...</p>
        </div>
      ) : error && !data ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : slices.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-12">
          No affiliation by legs yet
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="relative w-44 h-44 sm:w-40 sm:h-40 flex-shrink-0 mx-auto sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieSlices.length > 0 ? pieSlices : [{ name: "None", value: 1, color: "#1a2240" }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={pieSlices.length > 12 ? 0.4 : 2}
                  stroke="#0a0f24"
                  strokeWidth={1}
                >
                  {(pieSlices.length > 0
                    ? pieSlices
                    : [{ key: "empty", color: "#1a2240" }]
                  ).map((slice) => (
                    <Cell key={slice.key} fill={slice.color} />
                  ))}
                </Pie>
                {pieSlices.length > 0 ? <Tooltip content={<PieTooltip />} /> : null}
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[8px] text-slate-500">Total</span>
              <span className="text-[11px] font-bold text-white px-2 text-center leading-tight">
                {formatMtht(data?.totalAffiliate ?? 0, true)}
              </span>
            </div>
          </div>

          <div className="w-full sm:flex-1 space-y-1.5 max-h-56 overflow-y-auto scrollbar-hide">
            {slices.map((slice) => (
              <div key={slice.key} className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-[10px] text-slate-300 flex-1 truncate">
                  {slice.name}
                </span>
                {slice.isPower ? (
                  <Crown className="w-3 h-3 text-amber-300 shrink-0" />
                ) : null}
                <span className="text-[10px] text-white font-medium shrink-0">
                  {formatMtht(slice.value, true)}
                </span>
                <span className="text-[10px] text-slate-500 w-10 text-right shrink-0">
                  {slice.percent.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
