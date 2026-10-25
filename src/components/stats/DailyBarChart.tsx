import React, { useState } from 'react';
import { formatTaka } from '../../domain/money';

interface DailySpendingItem {
  day: number;
  dateStr: string;
  amount: number;
}

interface DailyBarChartProps {
  days: DailySpendingItem[];
  daysInMonth: number;
  theme?: 'dark' | 'light';
}

export const DailyBarChart: React.FC<DailyBarChartProps> = ({
  days,
  daysInMonth,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [hoveredDay, setHoveredDay] = useState<DailySpendingItem | null>(null);

  const maxVal = Math.max(...days.map((d) => d.amount), 100);

  return (
    <div className="w-full h-full flex flex-col justify-between pt-1 pb-1">
      {/* Bars row */}
      <div
        className={`h-40 flex items-end gap-1 px-2 pt-6 pb-2 rounded-lg border overflow-x-auto scrollbar-none relative ${
          isDark ? 'bg-[#0C0E12] border-[#3D4943]/30' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Dynamic Tooltip Header */}
        <div className="absolute top-1.5 left-3 right-3 flex items-center justify-between text-[11px] pointer-events-none">
          {hoveredDay ? (
            <span className={`font-mono font-semibold ${isDark ? 'text-[#73E3B4]' : 'text-emerald-700'}`}>
              Day {hoveredDay.day}: {formatTaka(hoveredDay.amount)}
            </span>
          ) : (
            <span className={isDark ? 'text-[#87948C]' : 'text-slate-400'}>
              Hover or tap bar for daily total
            </span>
          )}
          <span className={`text-[10px] font-mono ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
            Peak: {formatTaka(maxVal)}
          </span>
        </div>

        {days.map((d) => {
          const isZero = d.amount === 0;
          const heightPct = isZero ? 3 : Math.min(100, Math.max(6, Math.round((d.amount / maxVal) * 100)));
          const isHovered = hoveredDay?.day === d.day;

          return (
            <div
              key={d.day}
              onMouseEnter={() => setHoveredDay(d)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={() => setHoveredDay(d)}
              className="flex-1 min-w-[10px] max-w-[28px] flex flex-col items-center justify-end h-full cursor-pointer group"
            >
              <div
                className={`w-full rounded-t transition-all duration-200 ${
                  isZero
                    ? isDark
                      ? 'bg-[#1A1C20] opacity-40 hover:opacity-80'
                      : 'bg-slate-200 opacity-60 hover:opacity-100'
                    : isHovered
                    ? 'bg-[#55C79A] scale-y-105'
                    : isDark
                    ? 'bg-[#73E3B4]'
                    : 'bg-emerald-600'
                }`}
                style={{ height: `${heightPct}%` }}
              />
              <span
                className={`text-[8px] font-mono mt-1 select-none ${
                  isHovered
                    ? isDark ? 'text-[#73E3B4] font-bold' : 'text-emerald-700 font-bold'
                    : isDark ? 'text-[#87948C]' : 'text-slate-400'
                }`}
              >
                {d.day === 1 || d.day % 5 === 0 || d.day === daysInMonth ? d.day : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Subline explanation */}
      <div className={`flex items-center justify-between text-[10px] px-1 pt-2 ${isDark ? 'text-[#87948C]' : 'text-slate-500'}`}>
        <span>Dim markers signify genuine 0-spend days</span>
        <span className="font-mono">Days 1 – {daysInMonth}</span>
      </div>
    </div>
  );
};
