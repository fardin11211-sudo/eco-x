import React, { useState } from 'react';
import { formatTaka } from '../../domain/money';

interface DailyBudgetBar {
  dateStr: string;
  label: string;
  spent: number;
  limit: number;
  isOver: boolean;
}

interface BudgetComboChartProps {
  days: DailyBudgetBar[];
  dailyBudgetLimit: number;
  theme?: 'dark' | 'light';
}

export const BudgetComboChart: React.FC<BudgetComboChartProps> = ({
  days,
  dailyBudgetLimit,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(...days.map((d) => Math.max(d.spent, d.limit)), dailyBudgetLimit, 100);

  // Calculate vertical percentage for the dashed daily budget line
  const limitLineBottomPct = Math.min(95, Math.max(5, Math.round((dailyBudgetLimit / maxVal) * 100)));

  return (
    <div className="w-full h-full flex flex-col justify-between pt-1 pb-1">
      {/* Bars row with horizontal dashed limit line */}
      <div
        className={`h-40 flex items-end gap-1 px-2 pt-6 pb-2 rounded-lg border relative overflow-x-auto scrollbar-none ${
          isDark ? 'bg-[#0C0E12] border-[#3D4943]/30' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Dynamic header / tooltip */}
        <div className="absolute top-1.5 left-3 right-3 flex items-center justify-between text-[11px] pointer-events-none z-10">
          {hoveredIdx !== null ? (
            <span
              className={`font-mono font-semibold ${
                days[hoveredIdx].isOver
                  ? isDark ? 'text-[#FFB4AB]' : 'text-rose-600'
                  : isDark ? 'text-[#73E3B4]' : 'text-emerald-700'
              }`}
            >
              {days[hoveredIdx].label}: {formatTaka(days[hoveredIdx].spent)} (Limit: {formatTaka(days[hoveredIdx].limit)})
            </span>
          ) : (
            <span className={isDark ? 'text-[#87948C]' : 'text-slate-400'}>
              Daily Limit: {formatTaka(dailyBudgetLimit)}
            </span>
          )}

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-[#87948C]">
              <span className="w-3 border-b border-dashed border-[#F59E0B]" /> Target Pace
            </span>
          </div>
        </div>

        {/* Dashed Horizontal Line across chart */}
        <div
          className="absolute left-2 right-2 border-b-2 border-dashed border-[#F59E0B]/80 z-20 pointer-events-none"
          style={{ bottom: `${limitLineBottomPct}%` }}
        />

        {/* 14 Daily Bars */}
        {days.map((d, idx) => {
          const heightPct = Math.min(100, Math.max(4, Math.round((d.spent / maxVal) * 100)));
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={d.dateStr}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setHoveredIdx(idx)}
              className="flex-1 min-w-[12px] flex flex-col items-center justify-end h-full cursor-pointer group z-10"
            >
              <div
                className={`w-full rounded-t transition-all duration-200 ${
                  d.isOver
                    ? isDark ? 'bg-[#FFB4AB] hover:brightness-110' : 'bg-rose-500 hover:brightness-110'
                    : isDark ? 'bg-[#73E3B4] hover:brightness-110' : 'bg-emerald-600 hover:brightness-110'
                } ${isHovered ? 'scale-y-105' : ''}`}
                style={{ height: `${heightPct}%` }}
              />
              <span
                className={`text-[8px] font-mono mt-1 select-none ${
                  isHovered
                    ? isDark ? 'text-[#73E3B4] font-bold' : 'text-emerald-700 font-bold'
                    : isDark ? 'text-[#87948C]' : 'text-slate-400'
                }`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className={`flex items-center justify-between text-[10px] px-1 pt-2 ${isDark ? 'text-[#87948C]' : 'text-slate-500'}`}>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#FFB4AB]" /> Over Limit
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#73E3B4]" /> Under Limit
          </span>
        </span>
        <span className="font-mono">Last 14 Days</span>
      </div>
    </div>
  );
};
