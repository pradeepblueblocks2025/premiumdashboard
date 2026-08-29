"use client";

import { formatNumber } from "@/lib/format";
import type { LiveBusinessPoint } from "@/lib/types";
import { useId, useMemo } from "react";

type Point = { x: number; y: number; label: string; value: number };

const WIDTH = 640;
const HEIGHT = 290;
const PAD = { top: 36, right: 50, bottom: 34, left: 14 };

function chartValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${Math.round(value)}`;
}

function ribbonPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    d += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
}

export default function PremiumAffiliateChart({
  series,
  dense = false,
}: {
  series: LiveBusinessPoint[];
  dense?: boolean;
}) {
  const uid = useId().replace(/:/g, "");

  const chart = useMemo(() => {
    const plotW = WIDTH - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const maxValue = Math.max(...series.map((item) => item.mtht), 1);
    const count = Math.max(series.length, 1);

    const points: Point[] = series.map((item, index) => ({
      x: PAD.left + (count === 1 ? plotW / 2 : (index / (count - 1)) * plotW),
      y: PAD.top + (1 - item.mtht / maxValue) * plotH,
      label: item.label,
      value: item.mtht,
    }));

    const line = ribbonPath(points);
    const last = points[points.length - 1];
    const area = last
      ? `${line} L ${last.x} ${PAD.top + plotH} L ${points[0].x} ${PAD.top + plotH} Z`
      : "";
    const ticks = [1, 0.66, 0.33, 0].map((ratio) => ({
      y: PAD.top + (1 - ratio) * plotH,
      value: maxValue * ratio,
    }));

    return { points, line, area, ticks, plotH, plotW, last, maxValue };
  }, [series]);

  if (series.length === 0) return null;

  const columnWidth = Math.max(
    4,
    Math.min(dense ? 11 : 22, chart.plotW / series.length - (dense ? 2 : 5))
  );
  const dateStep = Math.max(1, Math.ceil(series.length / 7));
  const valueStep = series.length > 10 ? Math.max(2, Math.ceil(series.length / 8)) : 1;

  return (
    <div className="premium-affiliate-chart relative overflow-hidden rounded-lg">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-[240px] sm:h-[270px]"
        role="img"
        aria-label="Community affiliations chart"
      >
        <defs>
          <linearGradient id={`${uid}-velvet`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2a1d0c" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#120d08" stopOpacity="0" />
            <stop offset="100%" stopColor="#3a2a12" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={`${uid}-foil`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff3c4" />
            <stop offset="38%" stopColor="#e8c36a" />
            <stop offset="100%" stopColor="#8a6416" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={`${uid}-mountain`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3d27a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#f3d27a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c9a227" />
            <stop offset="45%" stopColor="#fff1c2" />
            <stop offset="100%" stopColor="#d4a017" />
          </linearGradient>
          <clipPath id={`${uid}-reveal`}>
            <rect x="0" y="0" height={HEIGHT} width="0">
              <animate
                attributeName="width"
                from="0"
                to={WIDTH}
                dur="1.8s"
                fill="freeze"
              />
            </rect>
          </clipPath>
        </defs>

        <rect
          x={PAD.left}
          y={PAD.top}
          width={chart.plotW}
          height={chart.plotH}
          fill={`url(#${uid}-velvet)`}
        />

        {chart.ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke="rgba(232, 195, 106, 0.12)"
              strokeDasharray="3 5"
            />
            <text
              x={WIDTH - PAD.right + 8}
              y={tick.y + 3}
              fill="#c9a84c"
              fontSize="9"
              opacity="0.8"
            >
              {formatNumber(tick.value, 0, true)}
            </text>
          </g>
        ))}

        {chart.points.map((point, index) => {
          if (point.value <= 0) return null;
          const barH = PAD.top + chart.plotH - point.y;
          return (
            <rect
              key={`col-${point.label}-${index}`}
              className="premium-affiliate-col"
              x={point.x - columnWidth / 2}
              y={point.y}
              width={columnWidth}
              height={Math.max(barH, 3)}
              rx={columnWidth / 2}
              fill={`url(#${uid}-foil)`}
              opacity={index === series.length - 1 ? 0.95 : 0.55}
              style={{
                animationDelay: `${0.06 + index * Math.min(0.06, 1.2 / series.length)}s`,
              }}
            />
          );
        })}

        <g clipPath={`url(#${uid}-reveal)`}>
          <path d={chart.area} fill={`url(#${uid}-mountain)`} />
          <path
            d={chart.line}
            fill="none"
            stroke={`url(#${uid}-metal)`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {chart.points.map((point, index) => {
          const showMark =
            !dense ||
            point.value > 0 ||
            index === 0 ||
            index === series.length - 1 ||
            index % dateStep === 0;
          const showValue =
            (index % valueStep === 0 || index === series.length - 1) &&
            (point.value > 0 || series.length <= 10);
          const showDate =
            index % dateStep === 0 || index === series.length - 1;
          const isLast = index === series.length - 1;

          return (
            <g key={`mark-${point.label}-${index}`}>
              {showMark && point.value > 0 ? (
                <polygon
                  points={`${point.x},${point.y - 4.2} ${point.x + 4.2},${point.y} ${point.x},${point.y + 4.2} ${point.x - 4.2},${point.y}`}
                  fill={isLast ? "#fff6d8" : "#1a1208"}
                  stroke={isLast ? "#e8c36a" : "#f3d27a"}
                  strokeWidth="1.2"
                />
              ) : null}
              {showValue ? (
                <text
                  x={point.x}
                  y={point.y + (dense && index % 2 === 1 ? 16 : -11)}
                  textAnchor="middle"
                  fill="#fff6d8"
                  fontSize={dense ? 8 : 10}
                  fontWeight={700}
                >
                  {chartValue(point.value)}
                </text>
              ) : null}
              {showDate ? (
                <text
                  x={point.x}
                  y={PAD.top + chart.plotH + 18}
                  textAnchor="middle"
                  fill="#b8954a"
                  fontSize={dense ? 8 : 9}
                >
                  {point.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
