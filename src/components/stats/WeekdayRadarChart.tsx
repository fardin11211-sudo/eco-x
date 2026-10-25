import React, { useState } from 'react';
import { WeekdayStat } from '../../domain/statistics';
import { formatTaka } from '../../domain/money';

interface WeekdayRadarChartProps {
  weekdayStats: WeekdayStat[];
  theme?: 'dark' | 'light';
}

export const WeekdayRadarChart: React.FC<WeekdayRadarChartProps> = ({
  weekdayStats,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(...weekdayStats.map((w) => w.averageSpent), 100);

  // SVG Radar Geometry (7 axes for Sun..Sat)
  const size = 260;
  const center = size / 2;
  const maxR = 85;
  const n = 7;

  // Concentric polygon web levels (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (idx: number, radius: number) => {
    // Start at -90deg (12 o'clock)
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / n;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };

  // Build points string for a given radius ratio
  const getPolygonPoints = (ratio: number) => {
    return Array.from({ length: n })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, maxR * ratio);
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Actual data points
  const dataPoints = weekdayStats.map((w, idx) => {
    const ratio = maxVal > 0 ? Math.max(0.05, w.averageSpent / maxVal) : 0.05;
    const { x, y } = getCoordinates(idx, maxR * ratio);
    return { ...w, x, y };
  });

  const dataPolygonString = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const activeStat = hoveredIdx !== null ? weekdayStats[hoveredIdx] : null;

  return (
    <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-4 py-1">
      {/* 7-Axis SVG Radar */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Concentric Web Polygons */}
          {levels.map((lvl) => (
            <polygon
              key={`lvl_${lvl}`}
              points={getPolygonPoints(lvl)}
              fill="none"
              stroke={isDark ? '#3D4943' : '#E2E8F0'}
              strokeWidth="1"
              strokeDasharray={lvl === 1.0 ? 'none' : '3 3'}
              opacity={isDark ? 0.6 : 0.8}
            />
          ))}

          {/* Radial Spokes from Center to each Vertex */}
          {Array.from({ length: n }).map((_, i) => {
            const { x, y } = getCoordinates(i, maxR);
            return (
              <line
                key={`spoke_${i}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke={isDark ? '#3D4943' : '#E2E8F0'}
                strokeWidth="1"
                opacity={0.5}
              />
            );
          })}

          {/* Filled Data Polygon */}
          <polygon
            points={dataPolygonString}
            fill="#73E3B4"
            fillOpacity={isDark ? 0.35 : 0.25}
            stroke="#73E3B4"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Vertex Point Markers & Labels */}
          {dataPoints.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            const labelCoord = getCoordinates(idx, maxR + 18);

            return (
              <g
                key={`pt_${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Marker */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill="#73E3B4"
                  stroke={isDark ? '#1A1C20' : '#FFFFFF'}
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Day label text */}
                <text
                  x={labelCoord.x}
                  y={labelCoord.y + 3}
                  textAnchor="middle"
                  className={`text-[10px] font-mono select-none ${
                    isHovered
                      ? isDark ? 'fill-[#73E3B4] font-bold' : 'fill-emerald-700 font-bold'
                      : isDark ? 'fill-[#87948C]' : 'fill-slate-500'
                  }`}
                >
                  {p.shortName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Weekday List / Inspection Panel on the right */}
      <div className="flex-1 w-full max-h-[220px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
        {activeStat && (
          <div className={`p-2 rounded-lg border mb-2 text-xs font-mono flex items-center justify-between ${
            isDark ? 'bg-[#0C0E12] border-[#73E3B4]/40 text-[#73E3B4]' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}>
            <span>{activeStat.dayName}:</span>
            <span className="font-bold">Avg {formatTaka(activeStat.averageSpent)} / day</span>
          </div>
        )}

        {weekdayStats.map((w, idx) => {
          const isHovered = hoveredIdx === idx;
          const barWidth = maxVal > 0 ? Math.min(100, Math.round((w.averageSpent / maxVal) * 100)) : 0;

          return (
            <div
              key={w.dayName}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`p-2 rounded-lg border flex flex-col justify-between cursor-pointer transition-colors ${
                isHovered
                  ? isDark ? 'bg-[#1E2024] border-[#73E3B4]/40' : 'bg-emerald-50 border-emerald-300'
                  : isDark ? 'bg-[#0C0E12] border-[#3D4943]/20' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isDark ? 'text-[#E2E2E8]' : 'text-slate-800'}`}>
                  {w.dayName} ({w.occurrencesInMonth} days)
                </span>
                <span className={`font-mono tabular-nums font-semibold ${isDark ? 'text-[#73E3B4]' : 'text-emerald-700'}`}>
                  {formatTaka(w.averageSpent)}/day
                </span>
              </div>
              <div className={`w-full h-1 rounded-full mt-1.5 overflow-hidden ${isDark ? 'bg-[#1A1C20]' : 'bg-slate-200'}`}>
                <div
                  className="h-full bg-[#73E3B4] rounded-full transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
