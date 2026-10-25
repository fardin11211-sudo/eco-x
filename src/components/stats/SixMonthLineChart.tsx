import React, { useState } from 'react';
import { SixMonthTrendItem } from '../../domain/statistics';
import { formatTaka } from '../../domain/money';

interface SixMonthLineChartProps {
  trend: SixMonthTrendItem[];
  theme?: 'dark' | 'light';
}

export const SixMonthLineChart: React.FC<SixMonthLineChartProps> = ({
  trend,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (trend.length === 0) {
    return <div className="text-xs text-center py-8 opacity-60">No history available.</div>;
  }

  const maxVal = Math.max(...trend.map((t) => Math.max(t.totalSpent, t.totalEarned)), 100);

  // SVG dimensions
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingTop = 20;
  const paddingBottom = 30;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingTop - paddingBottom;

  const pointsSpent = trend.map((t, idx) => {
    const x = paddingX + (idx / (trend.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - (t.totalSpent / maxVal) * plotHeight;
    return { x, y, ...t };
  });

  const pointsEarned = trend.map((t, idx) => {
    const x = paddingX + (idx / (trend.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - (t.totalEarned / maxVal) * plotHeight;
    return { x, y, ...t };
  });

  // Smooth cubic Bezier spline with tension = 0.4
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    const tension = 0.4;
    let path = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + ((p2.x - p0.x) * tension) / 2;
      const cp1y = p1.y + ((p2.y - p0.y) * tension) / 2;
      const cp2x = p2.x - ((p3.x - p1.x) * tension) / 2;
      const cp2y = p2.y - ((p3.y - p1.y) * tension) / 2;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const spentLinePath = buildSmoothPath(pointsSpent);
  const earnedLinePath = buildSmoothPath(pointsEarned);

  // Filled area path under spent curve
  const bottomY = paddingTop + plotHeight;
  const spentAreaPath = `${spentLinePath} L ${pointsSpent[pointsSpent.length - 1].x} ${bottomY} L ${pointsSpent[0].x} ${bottomY} Z`;

  const hoveredItem = hoveredIdx !== null ? trend[hoveredIdx] : null;

  return (
    <div className="w-full h-full flex flex-col justify-between pt-1">
      {/* Dynamic Tooltip / Legend bar */}
      <div className="flex items-center justify-between text-xs px-2 mb-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFB4AB]" />
            <span className={`text-[11px] ${isDark ? 'text-[#BCCAC1]' : 'text-slate-600'}`}>
              Spent (Outflow)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#73E3B4]" />
            <span className={`text-[11px] ${isDark ? 'text-[#BCCAC1]' : 'text-slate-600'}`}>
              Earned (Inflow)
            </span>
          </div>
        </div>

        {hoveredItem && (
          <div className="text-[11px] font-mono font-medium">
            <span className="text-[#87948C] mr-2">{hoveredItem.monthLabel}:</span>
            <span className="text-[#FFB4AB] mr-2">Spent {formatTaka(hoveredItem.totalSpent)}</span>
            <span className="text-[#73E3B4]">Earned {formatTaka(hoveredItem.totalEarned)}</span>
          </div>
        )}
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full h-44">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFB4AB" stopOpacity={isDark ? "0.35" : "0.25"} />
              <stop offset="100%" stopColor="#FFB4AB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = paddingTop + plotHeight * ratio;
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke={isDark ? '#3D4943' : '#E2E8F0'}
                strokeDasharray="4 4"
                strokeWidth="1"
                opacity="0.4"
              />
            );
          })}

          {/* Spent filled area */}
          <path d={spentAreaPath} fill="url(#spentGradient)" />

          {/* Inflow smooth line */}
          <path
            d={earnedLinePath}
            fill="none"
            stroke="#73E3B4"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Spent smooth line */}
          <path
            d={spentLinePath}
            fill="none"
            stroke="#FFB4AB"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Point markers for Spent */}
          {pointsSpent.map((p, idx) => (
            <g
              key={`sp_${idx}`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === idx ? 6 : 4}
                fill="#FFB4AB"
                stroke={isDark ? '#1A1C20' : '#FFFFFF'}
                strokeWidth="2"
                className="transition-all"
              />
            </g>
          ))}

          {/* Point markers for Earned */}
          {pointsEarned.map((p, idx) => (
            <g
              key={`earn_${idx}`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === idx ? 6 : 3.5}
                fill="#73E3B4"
                stroke={isDark ? '#1A1C20' : '#FFFFFF'}
                strokeWidth="2"
                className="transition-all"
              />
            </g>
          ))}

          {/* X Axis labels */}
          {pointsSpent.map((p, idx) => (
            <text
              key={`lbl_${idx}`}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className={`text-[10px] font-mono select-none ${
                hoveredIdx === idx
                  ? isDark ? 'fill-[#73E3B4] font-bold' : 'fill-emerald-700 font-bold'
                  : isDark ? 'fill-[#87948C]' : 'fill-slate-500'
              }`}
            >
              {p.monthLabel}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
