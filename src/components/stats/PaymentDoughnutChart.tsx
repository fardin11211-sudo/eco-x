import React, { useState } from 'react';
import { formatTaka } from '../../domain/money';

interface PaymentMethodItem {
  methodId: string;
  name: string;
  amount: number;
  percentage: number;
}

interface PaymentDoughnutChartProps {
  methods: PaymentMethodItem[];
  totalSpent: number;
  theme?: 'dark' | 'light';
}

const DEFAULT_COLORS = ['#73E3B4', '#55C79A', '#BEC7D5', '#FFB4AB', '#94A3B8'];

export const PaymentDoughnutChart: React.FC<PaymentDoughnutChartProps> = ({
  methods,
  totalSpent,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (methods.length === 0 || totalSpent <= 0) {
    return (
      <div className={`text-center py-8 text-xs ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
        No payment method expenditures recorded for this period.
      </div>
    );
  }

  // Pre-assign colors
  const itemsWithColor = methods.map((m, idx) => ({
    ...m,
    color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
  }));

  // Calculate SVG arc paths for ~68% cutout doughnut
  const size = 180;
  const center = size / 2;
  const outerR = 72;
  const innerR = 72 * 0.68; // 48.96 (~68% cutout)

  let cumulativeAngle = -Math.PI / 2; // start at 12 o'clock

  const arcs = itemsWithColor.map((item, idx) => {
    const fraction = totalSpent > 0 ? item.amount / totalSpent : 0;
    const sweepAngle = fraction * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sweepAngle;
    cumulativeAngle = endAngle;

    // Outer arc points
    const x1 = center + outerR * Math.cos(startAngle);
    const y1 = center + outerR * Math.sin(startAngle);
    const x2 = center + outerR * Math.cos(endAngle);
    const y2 = center + outerR * Math.sin(endAngle);

    // Inner arc points
    const x3 = center + innerR * Math.cos(endAngle);
    const y3 = center + innerR * Math.sin(endAngle);
    const x4 = center + innerR * Math.cos(startAngle);
    const y4 = center + innerR * Math.sin(startAngle);

    const largeArcFlag = sweepAngle > Math.PI ? 1 : 0;

    // Handle full single slice edge case
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
    <div className="w-full flex flex-col items-center justify-between h-full pt-1 pb-2">
      {/* Doughnut SVG Container with 68% cutout */}
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {arcs.map((arc, idx) => (
            <path
              key={arc.methodId}
              d={arc.pathData}
              fill={arc.color}
              stroke={isDark ? '#1A1C20' : '#FFFFFF'}
              strokeWidth={1.5}
              className="cursor-pointer transition-transform duration-200"
              style={{
                transformOrigin: `${center}px ${center}px`,
                transform: arc.isHovered ? 'scale(1.04)' : 'scale(1)',
                opacity: hoveredIdx === null || arc.isHovered ? 1 : 0.6
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center Cutout Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className={`text-[10px] uppercase font-medium ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
            {activeItem ? activeItem.name : 'Total Outflow'}
          </span>
          <span className={`text-xs font-mono font-bold ${isDark ? 'text-[#E2E2E8]' : 'text-slate-900'}`}>
            {activeItem ? `${activeItem.percentage}%` : formatTaka(totalSpent)}
          </span>
        </div>
      </div>

      {/* Custom 3-Tile Legend below doughnut: dot, name, amount, % of total */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-inherit">
        {itemsWithColor.slice(0, 3).map((item, idx) => (
          <div
            key={item.methodId}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`p-2 rounded-lg border flex flex-col justify-between cursor-pointer transition-all ${
              hoveredIdx === idx
                ? isDark
                  ? 'bg-[#1E2024] border-[#73E3B4]/50'
                  : 'bg-emerald-50/50 border-emerald-300'
                : isDark
                ? 'bg-[#0C0E12] border-[#3D4943]/30'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className={`text-xs font-medium truncate ${isDark ? 'text-[#E2E2E8]' : 'text-slate-800'}`}>
                {item.name}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1">
              <span className={`text-xs font-mono font-semibold ${isDark ? 'text-[#E2E2E8]' : 'text-slate-900'}`}>
                {formatTaka(item.amount)}
              </span>
              <span className="text-[10px] font-mono font-bold" style={{ color: item.color }}>
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
