import React, { useState } from 'react';
import { CategoryStat } from '../../domain/statistics';
import { formatTaka } from '../../domain/money';

interface CategoryDoughnutChartProps {
  categories: CategoryStat[];
  totalSpent: number;
  theme?: 'dark' | 'light';
}

const CATEGORY_COLORS = [
  '#73E3B4', // mint/emerald
  '#55C79A', // primary green
  '#38BDF8', // sky
  '#A78BFA', // purple
  '#F472B6', // pink
  '#FBBF24', // amber
  '#FB923C', // orange
  '#94A3B8', // slate
  '#34D399', // emerald
  '#818CF8'  // indigo
];

export const CategoryDoughnutChart: React.FC<CategoryDoughnutChartProps> = ({
  categories,
  totalSpent,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (categories.length === 0 || totalSpent <= 0) {
    return (
      <div className={`text-center py-8 text-xs ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
        No category expenditures recorded for this period.
      </div>
    );
  }

  const itemsWithColor = categories.map((cat, idx) => ({
    ...cat,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
  }));

  // SVG doughnut geometry for ~55% cutout
  const size = 180;
  const center = size / 2;
  const outerR = 72;
  const innerR = 72 * 0.55; // 39.6 (~55% cutout)

  let cumulativeAngle = -Math.PI / 2;

  const arcs = itemsWithColor.map((item, idx) => {
    const fraction = totalSpent > 0 ? item.amount / totalSpent : 0;
    const sweepAngle = fraction * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sweepAngle;
    cumulativeAngle = endAngle;

    const x1 = center + outerR * Math.cos(startAngle);
    const y1 = center + outerR * Math.sin(startAngle);
    const x2 = center + outerR * Math.cos(endAngle);
    const y2 = center + outerR * Math.sin(endAngle);

    const x3 = center + innerR * Math.cos(endAngle);
    const y3 = center + innerR * Math.sin(endAngle);
    const x4 = center + innerR * Math.cos(startAngle);
    const y4 = center + innerR * Math.sin(startAngle);

    const largeArcFlag = sweepAngle > Math.PI ? 1 : 0;

    let pathData: string;
    if (fraction >= 0.999) {
      pathData = `
        M ${center} ${center - outerR}
        A ${outerR} ${outerR} 0 1 0 ${center} ${center + outerR}
        A ${outerR} ${outerR} 0 1 0 ${center} ${center - outerR}
        M ${center} ${center - innerR}
        A ${innerR} ${innerR} 0 1 1 ${center} ${center + innerR}
        A ${innerR} ${innerR} 0 1 1 ${center} ${center - innerR}
        Z
      `;
    } else {
      pathData = `
        M ${x1} ${y1}
        A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4}
        Z
      `;
    }

    return {
      ...item,
      pathData,
      isHovered: hoveredIdx === idx
    };
  });

  const activeItem = hoveredIdx !== null ? itemsWithColor[hoveredIdx] : null;

  return (
    <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Donut graphic */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {arcs.map((arc, idx) => (
            <path
              key={arc.name}
              d={arc.pathData}
              fill={arc.color}
              stroke={isDark ? '#1A1C20' : '#FFFFFF'}
              strokeWidth={1.5}
              className="cursor-pointer transition-transform duration-200"
              style={{
                transformOrigin: `${center}px ${center}px`,
                transform: arc.isHovered ? 'scale(1.05)' : 'scale(1)',
                opacity: hoveredIdx === null || arc.isHovered ? 1 : 0.6
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center cutout info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          <span className={`text-[10px] uppercase font-medium truncate max-w-[80px] ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
            {activeItem ? activeItem.name : 'Top Outflow'}
          </span>
          <span className={`text-xs font-mono font-bold ${isDark ? 'text-[#E2E2E8]' : 'text-slate-900'}`}>
            {activeItem ? `${activeItem.percentage}%` : formatTaka(totalSpent)}
          </span>
        </div>
      </div>

      {/* Legend on the right side */}
      <div className="flex-1 w-full max-h-[220px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
        {itemsWithColor.slice(0, 7).map((item, idx) => (
          <div
            key={item.name}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors ${
              hoveredIdx === idx
                ? isDark
                  ? 'bg-[#1E2024] text-[#73E3B4]'
                  : 'bg-emerald-50 text-emerald-800'
                : isDark
                ? 'hover:bg-[#1E2024]/60 text-[#E2E2E8]'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono">
              <span className="font-semibold">{formatTaka(item.amount)}</span>
              <span className="text-[10px] w-8 text-right text-[#87948C]">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
