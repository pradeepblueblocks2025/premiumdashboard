"use client";

import { fetchAffiliateEarned } from "@/lib/affiliateEarned";
import {
  accountStatusFromTotals,
  type AccountStatusId,
} from "@/lib/accountStatus";
import { fetchLiveBusiness } from "@/lib/liveBusiness";
import {
  Award,
  Crown,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const THEME: Record<
  AccountStatusId,
  {
    Icon: typeof Crown;
    text: string;
    sub: string;
    border: string;
    bg: string;
    glow: string;
    chip: string;
  }
> = {
  legendary: {
    Icon: Crown,
    text: "text-amber-200",
    sub: "text-amber-200/70",
    border: "border-amber-400/40",
    bg: "bg-gradient-to-br from-amber-500/15 to-yellow-600/5",
    glow: "shadow-[0_0_28px_rgba(245,158,11,0.28)]",
    chip: "bg-amber-400 text-[#1a1204]",
  },
  excellent: {
    Icon: Award,
    text: "text-emerald-300",
    sub: "text-emerald-300/70",
    border: "border-emerald-400/35",
    bg: "bg-gradient-to-br from-emerald-500/15 to-teal-600/5",
    glow: "shadow-[0_0_28px_rgba(16,185,129,0.25)]",
    chip: "bg-emerald-400 text-[#042012]",
  },
  good: {
    Icon: ThumbsUp,
    text: "text-sky-300",
    sub: "text-sky-300/70",
    border: "border-sky-400/35",
    bg: "bg-gradient-to-br from-sky-500/15 to-cyan-600/5",
    glow: "shadow-[0_0_28px_rgba(56,189,248,0.22)]",
    chip: "bg-sky-400 text-[#041820]",
  },
  fair: {
    Icon: ShieldCheck,
    text: "text-yellow-300",
    sub: "text-yellow-300/70",
    border: "border-yellow-400/35",
    bg: "bg-gradient-to-br from-yellow-500/12 to-amber-700/5",
    glow: "shadow-[0_0_24px_rgba(250,204,21,0.18)]",
    chip: "bg-yellow-400 text-[#1a1604]",
  },
  poor: {
    Icon: ShieldAlert,
    text: "text-orange-300",
    sub: "text-orange-300/70",
    border: "border-orange-400/35",
    bg: "bg-gradient-to-br from-orange-500/15 to-red-700/5",
    glow: "shadow-[0_0_24px_rgba(251,146,60,0.2)]",
    chip: "bg-orange-400 text-[#1a0c04]",
  },
  very_poor: {
    Icon: TriangleAlert,
    text: "text-rose-300",
    sub: "text-rose-300/70",
    border: "border-rose-400/40",
    bg: "bg-gradient-to-br from-rose-500/15 to-red-800/5",
    glow: "shadow-[0_0_24px_rgba(244,63,94,0.22)]",
    chip: "bg-rose-400 text-[#1a0408]",
  },
};

function ratioLabel(ratio: number | null): string {
  if (ratio == null) return "No affiliation in 7 days";
  return `${Math.round(ratio * 100)}% of affiliation`;
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
      <div className="w-full sm:w-auto sm:min-w-[220px] rounded-xl border border-[#1a2240] bg-[#0d1228]/80 px-4 py-3 flex items-center gap-2">
        <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
        <span className="text-[11px] text-slate-500">Checking status...</span>
      </div>
    );
  }

  if (!status) return null;

  const theme = THEME[status.id];
  const Icon = theme.Icon;

  return (
    <div
      className={`w-full sm:w-auto sm:min-w-[240px] rounded-xl border px-4 py-3 ${theme.border} ${theme.bg} ${theme.glow}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
          Account Status
        </p>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${theme.chip}`}>
          7 DAYS
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div
          className={`w-9 h-9 rounded-lg border ${theme.border} bg-black/20 flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${theme.text}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-lg sm:text-xl font-bold tracking-wide ${theme.text}`}>
            {status.label}
          </p>
          <p className={`text-[10px] mt-0.5 ${theme.sub}`}>
            {ratioLabel(status.ratio)}
          </p>
        </div>
      </div>
    </div>
  );
}
