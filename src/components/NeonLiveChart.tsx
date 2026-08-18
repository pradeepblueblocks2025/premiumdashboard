"use client";

import { formatNumber } from "@/lib/format";
import type { LiveBusinessPoint } from "@/lib/types";
import { useId, useMemo } from "react";

type Point = { x: number; y: number; label: string; value: number };

const WIDTH = 640;
const HEIGHT = 290;
const PAD = { top: 34, right: 48, bottom: 32, left: 10 };

function chartValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${Math.round(value)}`;
}

function smoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function arrowAngle(points: Point[]): number {
  if (points.length < 2) return -35;
  const from = points[points.length - 2];
  const to = points[points.length - 1];
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

export default function NeonLiveChart({
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

    const line = smoothPath(points);
    const last = points[points.length - 1];
    const area = last
      ? `${line} L ${last.x} ${PAD.top + plotH} L ${points[0].x} ${PAD.top + plotH} Z`
      : "";
    const ticks = [1, 0.66, 0.33, 0].map((ratio) => ({
      y: PAD.top + (1 - ratio) * plotH,
      value: maxValue * ratio,
    }));

    return {
      points,
      line,
      area,
      ticks,
      plotH,
      plotW,
      angle: arrowAngle(points),
      last,
      maxValue,
    };
  }, [series]);

  if (series.length === 0) return null;

  const barWidth = Math.max(
    3,
    Math.min(dense ? 10 : 18, chart.plotW / series.length - (dense ? 3 : 6))
  );
  const dateStep = Math.max(1, Math.ceil(series.length / 7));
  const valueStep = series.length > 10 ? Math.max(2, Math.ceil(series.length / 8)) : 1;

  return (
    <div className="neon-live-chart relative overflow-hidden rounded-lg">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-[240px] sm:h-[270px]"
        role="img"
        aria-label="Live community business chart"
      >
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#67f6ff" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#00d4ff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-bar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7af8ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#00c8ff" stopOpacity="0.08" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <clipPath id={`${uid}-reveal`}>
            <rect x="0" y="0" height={HEIGHT} width="0">
              <animate
                attributeName="width"
                from="0"
                to={WIDTH}
                dur="2.4s"
                fill="freeze"
              />
            </rect>
          </clipPath>
        </defs>

        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={PAD.top + (i * chart.plotH) / 7}
            y2={PAD.top + (i * chart.plotH) / 7}
            stroke="rgba(0, 220, 255, 0.08)"
          />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <line
            key={`v-${i}`}
            y1={PAD.top}
            y2={PAD.top + chart.plotH}
            x1={PAD.left + (i * chart.plotW) / 9}
            x2={PAD.left + (i * chart.plotW) / 9}
            stroke="rgba(0, 220, 255, 0.06)"
          />
        ))}

        {chart.points.map((point, index) => {
          if (point.value <= 0) return null;
          const barH = PAD.top + chart.plotH - point.y;
          return (
            <rect
              key={`bar-${point.label}-${index}`}
              className="neon-bar"
              x={point.x - barWidth / 2}
              y={point.y}
              width={barWidth}
              height={Math.max(barH, 2)}
              rx={2}
              fill={`url(#${uid}-bar)`}
              stroke="rgba(103, 246, 255, 0.45)"
              strokeWidth="0.8"
              style={{
                animationDelay: `${0.08 + index * Math.min(0.08, 1.4 / series.length)}s`,
              }}
            />
          );
        })}

        <g clipPath={`url(#${uid}-reveal)`}>
          <path d={chart.area} fill={`url(#${uid}-fill)`} />
          <path
            d={chart.line}
            fill="none"
            stroke="#67f6ff"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.22"
            filter={`url(#${uid}-soft)`}
          />
          <path
            className="neon-line-draw"
            d={chart.line}
            fill="none"
            stroke="#b8ffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${uid}-glow)`}
            pathLength={1}
          />
        </g>

        {chart.points.map((point, index) => {
          const showDot =
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

          return (
            <g key={`dot-${point.label}-${index}`}>
              {showDot ? (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={dense ? 2.4 : 3.4}
                  fill="#04131c"
                  stroke="#d9ffff"
                  strokeWidth="1.4"
                  filter={`url(#${uid}-glow)`}
                />
              ) : null}
              {showValue ? (
                <text
                  x={point.x}
                  y={point.y + (dense && index % 2 === 1 ? 16 : -10)}
                  textAnchor="middle"
                  fill="#e7ffff"
                  fontSize={dense ? 8 : 10}
                  fontWeight={700}
                  style={{ textShadow: "0 0 8px #67f6ff" }}
                >
                  {chartValue(point.value)}
                </text>
              ) : null}
              {showDate ? (
                <text
                  x={point.x}
                  y={PAD.top + chart.plotH + 16}
                  textAnchor="middle"
                  fill="#7dd3e8"
                  fontSize={dense ? 8 : 9}
                >
                  {point.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {chart.last && (
          <g
            transform={`translate(${chart.last.x}, ${chart.last.y}) rotate(${chart.angle})`}
            filter={`url(#${uid}-glow)`}
          >
            <polygon points="0,0 16,-6 16,6" fill="#ffffff" />
            <polygon points="4,0 18,-7 18,7" fill="#67f6ff" opacity="0.85" />
          </g>
        )}

        {chart.line && (
          <circle r="5.5" fill="#ffffff" filter={`url(#${uid}-glow)`}>
            <animateMotion
              begin="2.2s"
              dur="3.6s"
              repeatCount="indefinite"
              rotate="auto"
              path={chart.line}
            />
          </circle>
        )}

        {chart.ticks.map((tick) => (
          <text
            key={tick.y}
            x={WIDTH - PAD.right + 8}
            y={tick.y + 3}
            fill="#67f6ff"
            fontSize="9"
            opacity="0.75"
          >
            {formatNumber(tick.value, 0, true)}
          </text>
        ))}
      </svg>
    </div>
  );
}
