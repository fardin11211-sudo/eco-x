import React, { useState } from 'react';
import { HeatmapCell } from '../../domain/statistics';
import { formatTaka } from '../../domain/money';
import { formatDisplayDate } from '../../domain/dates';
import { RankedListRow } from './RankedListRow';
import { Flame } from 'lucide-react';

interface CalendarHeatmapProps {
  cells: (HeatmapCell | null)[];
  topDays: { dateStr: string; amount: number; dayOfMonth: number }[];
  maxSpending: number;
  monthLabel: string;
  theme?: 'dark' | 'light';
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  cells,
  topDays,
  maxSpending,
  monthLabel,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Intensity color palettes
  // Dark: 0 is neutral dark, 1..5 shades of emerald/mint
  // Light: 0 is neutral light, 1..5 shades of emerald
  const darkIntensityClasses = [
    'bg-[#0C0E12] text-[#87948C]/50 border-[#3D4943]/20', // 0
    'bg-[#003826] text-[#73E3B4] border-[#73E3B4]/20', // 1
    'bg-[#004d35] text-[#73E3B4] border-[#73E3B4]/30', // 2
    'bg-[#006b4a] text-[#E2E2E8] border-[#73E3B4]/40', // 3
    'bg-[#55C79A] text-[#003826] font-bold border-[#73E3B4]/60', // 4
    'bg-[#73E3B4] text-[#003826] font-bold border-white' // 5
  ];

  const lightIntensityClasses = [
    'bg-slate-100 text-slate-400 border-slate-200', // 0
    'bg-emerald-100 text-emerald-800 border-emerald-200', // 1
    'bg-emerald-200 text-emerald-900 border-emerald-300', // 2
    'bg-emerald-400 text-emerald-950 font-medium border-emerald-500', // 3
    'bg-emerald-600 text-white font-bold border-emerald-700', // 4
    'bg-emerald-700 text-white font-bold border-emerald-800' // 5
  ];

  const intensityClasses = isDark ? darkIntensityClasses : lightIntensityClasses;

  return (
    <div className="space-y-6">
      {/* Calendar Grid Container */}
      <div
        className={`p-5 rounded-xl border shadow-sm space-y-4 ${
          isDark ? 'bg-[#1A1C20] border-[#3D4943]/40' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-[#0C0E12] text-[#73E3B4]' : 'bg-emerald-50 text-emerald-700'}`}>
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#E2E2E8]' : 'text-slate-800'}`}>
                Calendar Spending Heatmap
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-[#87948C]' : 'text-slate-500'}`}>
                {monthLabel}
              </p>
            </div>
          </div>

          <span className={`text-[11px] font-mono tabular-nums ${isDark ? 'text-[#87948C]' : 'text-slate-500'}`}>
            Peak: {formatTaka(maxSpending)}
          </span>
        </div>

        {/* Weekday column headers (Sun to Sat) */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono uppercase tracking-wider font-semibold text-[#87948C]">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* 7-Column Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, idx) => {
            if (!cell) {
              return (
                <div
                  key={`empty_${idx}`}
                  className="h-10 sm:h-12 rounded bg-transparent opacity-0 pointer-events-none"
                />
              );
            }

            const formattedDate = formatDisplayDate(cell.dateStr);
            const titleTooltip = `${formattedDate}: ${cell.amount > 0 ? formatTaka(cell.amount) : '৳0.00'}`;

            return (
              <button
                key={cell.dateStr}
                type="button"
                title={titleTooltip}
                onMouseEnter={() => setHoveredCell(cell)}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => setHoveredCell(cell)}
                className={`h-10 sm:h-12 rounded border p-1 sm:p-1.5 flex flex-col justify-between transition-all select-none cursor-pointer ${
                  intensityClasses[cell.intensityLevel]
                } ${
                  cell.isToday
                    ? isDark
                      ? 'ring-2 ring-[#73E3B4] ring-offset-1 ring-offset-[#1A1C20]'
                      : 'ring-2 ring-emerald-600 ring-offset-1 ring-offset-white'
                    : ''
                }`}
              >
                <span className="text-[10px] font-mono font-medium self-start">
                  {cell.dayOfMonth}
                </span>

                {cell.amount > 0 && (
                  <span className="text-[9px] font-mono tabular-nums self-end truncate max-w-full leading-none">
                    {cell.amount >= 1000 ? `${Math.round(cell.amount / 1000)}k` : cell.amount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Hover Tooltip Line under grid */}
        <div
          className={`min-h-[28px] px-3 py-1.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
            isDark ? 'bg-[#0C0E12] border-[#3D4943]/30' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {hoveredCell ? (
            <div className="flex items-center gap-2">
              <span className={`font-medium ${isDark ? 'text-[#E2E2E8]' : 'text-slate-800'}`}>
                {formatDisplayDate(hoveredCell.dateStr)}:
              </span>
              <span className={`font-mono tabular-nums font-bold ${isDark ? 'text-[#73E3B4]' : 'text-emerald-700'}`}>
                {formatTaka(hoveredCell.amount)}
              </span>
              {hoveredCell.isToday && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${isDark ? 'bg-[#73E3B4]/20 text-[#73E3B4]' : 'bg-emerald-100 text-emerald-800'}`}>
                  Today
                </span>
              )}
            </div>
          ) : (
            <span className={`text-[11px] ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
              Hover or tap on any calendar square to view exact day's expenditure
            </span>
          )}

          {/* Less -> More Legend with 5 Swatches */}
          <div className="flex items-center gap-1.5 text-[10px] text-[#87948C]">
            <span>Less</span>
            <span className={`w-3 h-3 rounded border ${intensityClasses[0]}`} />
            <span className={`w-3 h-3 rounded ${intensityClasses[1]}`} />
            <span className={`w-3 h-3 rounded ${intensityClasses[2]}`} />
            <span className={`w-3 h-3 rounded ${intensityClasses[3]}`} />
            <span className={`w-3 h-3 rounded ${intensityClasses[4]}`} />
            <span className={`w-3 h-3 rounded ${intensityClasses[5]}`} />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Most Expensive Days: Ranked list of top 7 days */}
      {topDays.length > 0 && (
        <div
          className={`p-5 rounded-xl border shadow-sm space-y-3 ${
            isDark ? 'bg-[#1A1C20] border-[#3D4943]/40' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#E2E2E8]' : 'text-slate-800'}`}>
              Most Expensive Days (Top 7)
            </h3>
            <span className={`text-[11px] ${isDark ? 'text-[#87948C]' : 'text-slate-500'}`}>
              Ranked Outflows
            </span>
          </div>

          <div className="divide-y divide-inherit">
            {topDays.map((d, idx) => (
              <RankedListRow
                key={d.dateStr}
                rank={idx + 1}
                name={formatDisplayDate(d.dateStr)}
                amount={d.amount}
                maxAmount={maxSpending}
                color={idx === 0 ? '#EF4444' : idx < 3 ? '#F97316' : '#55C79A'}
                showPercentage={false}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
