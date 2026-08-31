"use client";

import { fetchAffiliateEarned } from "@/lib/affiliateEarned";
import {
  accountStatusFromTotals,
  ratioToGaugeScore,
  type AccountStatusId,
} from "@/lib/accountStatus";
import { fetchLiveBusiness } from "@/lib/liveBusiness";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const THEME: Record<
  AccountStatusId,
  { text: string; sub: string; border: string; bg: string; glow: string; chip: string }
> = {
  legendary: {
    text: "text-amber-200",
    sub: "text-amber-200/70",
    border: "border-amber-400/40",
    bg: "bg-gradient-to-br from-amber-500/15 to-yellow-600/5",
    glow: "shadow-[0_0_28px_rgba(245,158,11,0.28)]",
    chip: "bg-amber-400 text-[#1a1204]",
  },
  excellent: {
    text: "text-emerald-300",
    sub: "text-emerald-300/70",
    border: "border-emerald-400/35",
    bg: "bg-gradient-to-br from-emerald-500/15 to-teal-600/5",
    glow: "shadow-[0_0_28px_rgba(16,185,129,0.25)]",
    chip: "bg-emerald-400 text-[#042012]",
  },
  good: {
    text: "text-sky-300",
    sub: "text-sky-300/70",
    border: "border-sky-400/35",
    bg: "bg-gradient-to-br from-sky-500/15 to-cyan-600/5",
    glow: "shadow-[0_0_28px_rgba(56,189,248,0.22)]",
    chip: "bg-sky-400 text-[#041820]",
  },
  fair: {
    text: "text-yellow-300",
    sub: "text-yellow-300/70",
    border: "border-yellow-400/35",
    bg: "bg-gradient-to-br from-yellow-500/12 to-amber-700/5",
    glow: "shadow-[0_0_24px_rgba(250,204,21,0.18)]",
    chip: "bg-yellow-400 text-[#1a1604]",
  },
  poor: {
    text: "text-orange-300",
    sub: "text-orange-300/70",
    border: "border-orange-400/35",
    bg: "bg-gradient-to-br from-orange-500/15 to-red-700/5",
    glow: "shadow-[0_0_24px_rgba(251,146,60,0.2)]",
    chip: "bg-orange-400 text-[#1a0c04]",
  },
  very_poor: {
    text: "text-rose-300",
    sub: "text-rose-300/70",
    border: "border-rose-400/40",
    bg: "bg-gradient-to-br from-rose-500/15 to-red-800/5",
    glow: "shadow-[0_0_24px_rgba(244,63,94,0.22)]",
    chip: "bg-rose-400 text-[#1a0408]",
  },
};

const GAUGE_SEGMENTS = [
  { color: "#ef4444", from: 0, to: 0.2 },
  { color: "#f97316", from: 0.2, to: 0.4 },
  { color: "#eab308", from: 0.4, to: 0.6 },
  { color: "#84cc16", from: 0.6, to: 0.8 },
  { color: "#22c55e", from: 0.8, to: 1 },
];

const CX = 100;
const CY = 108;
const R = 78;
const STROKE = 14;

function pointOnArc(t: number) {
  const theta = Math.PI * (1 - t);
  return {
    x: CX + R * Math.cos(theta),
    y: CY - R * Math.sin(theta),
  };
}

function arcPath(from: number, to: number) {
  const start = pointOnArc(from);
  const end = pointOnArc(to);
  return `M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`;
}

function StatusGauge({
  score,
  value,
  label,
  labelClass,
}: {
  score: number;
  value: string;
  label: string;
  labelClass: string;
}) {
  const t = Math.min(1, Math.max(0, score / 100));
  const knob = useMemo(() => pointOnArc(t), [t]);

  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <svg viewBox="0 0 200 128" className="w-full h-auto overflow-visible">
        {GAUGE_SEGMENTS.map((segment) => (
          <path
            key={segment.color}
            d={arcPath(segment.from, segment.to)}
            fill="none"
            stroke={segment.color}
            strokeWidth={STROKE}
            strokeLinecap="butt"
          />
        ))}
        <path
          d={arcPath(0, 0.04)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        <path
          d={arcPath(0.96, 1)}
          fill="none"
          stroke="#22c55e"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        <circle
          cx={knob.x}
          cy={knob.y}
          r={9}
          fill="#ffffff"
          stroke="#94a3b8"
          strokeWidth={2.5}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center pointer-events-none">
        <span className="text-3xl font-bold text-white leading-none tabular-nums">
          {value}
        </span>
        <span className={`text-[11px] mt-1 ${labelClass}`}>{label}</span>
      </div>
    </div>
  );
}

export default function AccountStatusPanel({
  customerId = null,
}: {
  customerId?: string | null;
}) {
  const [status, setStatus] = useState<ReturnType<
    typeof accountStatusFromTotals
  > | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (signal?: { cancelled: boolean }) => {
      setLoading(true);
      try {
        const [business, affiliate] = await Promise.all([
          fetchLiveBusiness("7days", customerId),
          fetchAffiliateEarned(customerId, "7days"),
        ]);
        if (signal?.cancelled) return;
        const affiliateTotal =
          affiliate.week.totalMtht ||
          affiliate.series.reduce((sum, point) => sum + point.mtht, 0);
        setStatus(
          accountStatusFromTotals(business.summary.totalMtht, affiliateTotal)
        );
      } catch {
        if (signal?.cancelled) return;
        setStatus(null);
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

  if (loading && !status) {
    return (
      <div className="w-full h-full rounded-2xl border border-[#1a2240] bg-[#0d1228]/80 px-4 py-3 flex flex-col items-center justify-center gap-2 min-h-[160px]">
        <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
        <span className="text-[11px] text-slate-500">Checking status...</span>
      </div>
    );
  }

  if (!status) return null;

  const theme = THEME[status.id];
  const score = ratioToGaugeScore(status.ratio);
  const value =
    status.ratio == null ? "—" : String(Math.round(status.ratio * 100));

  return (
    <div
      className={`w-full h-full rounded-2xl border px-3 pt-3 pb-2 ${theme.border} ${theme.bg} ${theme.glow}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[11px] text-slate-400">Account Status</p>
        <span
          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${theme.chip}`}
        >
          7 DAYS
        </span>
      </div>
      <StatusGauge
        score={score}
        value={value}
        label={status.label}
        labelClass={theme.sub}
      />
    </div>
  );
}
