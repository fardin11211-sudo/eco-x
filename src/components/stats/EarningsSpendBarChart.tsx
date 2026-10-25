import React from 'react';
import { formatTaka } from '../../domain/money';

interface EarningsSpendBarChartProps {
  totalEarned: number;
  totalSpent: number;
  netSavings: number;
  theme?: 'dark' | 'light';
}

export const EarningsSpendBarChart: React.FC<EarningsSpendBarChartProps> = ({
  totalEarned,
  totalSpent,
  netSavings,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const maxVal = Math.max(totalEarned, totalSpent, Math.abs(netSavings), 100);

  const earnedPct = Math.round((totalEarned / maxVal) * 100);
  const spentPct = Math.round((totalSpent / maxVal) * 100);
  const netPct = Math.round((Math.abs(netSavings) / maxVal) * 100);

  return (
    <div className="w-full h-full flex flex-col justify-between pt-2 pb-1">
      {/* Bars Container */}
      <div className={`h-36 flex items-end justify-around px-6 pb-2 rounded-lg border relative ${
        isDark ? 'bg-[#0C0E12] border-[#3D4943]/30' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Horizontal gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
          <div className={`border-b border-dashed ${isDark ? 'border-[#3D4943]' : 'border-slate-300'}`} />
          <div className={`border-b border-dashed ${isDark ? 'border-[#3D4943]' : 'border-slate-300'}`} />
          <div className={`border-b border-dashed ${isDark ? 'border-[#3D4943]' : 'border-slate-300'}`} />
        </div>

        {/* 1. Inflow Bar */}
        <div className="flex flex-col items-center justify-end h-full z-10 w-16 group relative">
          <div className="absolute -top-7 hidden group-hover:flex bg-[#1E2024] border border-[#3D4943] text-[10px] font-mono px-2 py-0.5 rounded shadow text-white whitespace-nowrap">
            Inflow: {formatTaka(totalEarned)}
          </div>
          <div
            className="w-10 rounded-t bg-[#73E3B4] transition-all duration-300 group-hover:brightness-110 shadow-xs"
            style={{ height: `${Math.max(6, earnedPct)}%` }}
          />
          <span className={`text-[10px] font-medium mt-1.5 ${isDark ? 'text-[#87948C]' : 'text-slate-500'}`}>
            Earnings
          </span>
        </div>

        {/* 2. Outflow Bar */}
        <div className="flex flex-col items-center justify-end h-full z-10 w-16 group relative">
          <div className="absolute -top-7 hidden group-hover:flex bg-[#1E2024] border border-[#3D4943] text-[10px] font-mono px-2 py-0.5 rounded shadow text-white whitespace-nowrap">
            Outflow: {formatTaka(totalSpent)}
          </div>
          <div
            className="w-10 rounded-t bg-[#FFB4AB] transition-all duration-300 group-hover:brightness-110 shadow-xs"
            style={{ height: `${Math.max(6, spentPct)}%` }}
          />
          <span className={`text-[10px] font-medium mt-1.5 ${isDark ? 'text-[#87948C]' : 'text-slate-500'}`}>
            Spent
          </span>
        </div>

        {/* 3. Net Bar */}
        <div className="flex flex-col items-center justify-end h-full z-10 w-16 group relative">
          <div className="absolute -top-7 hidden group-hover:flex bg-[#1E2024] border border-[#3D4943] text-[10px] font-mono px-2 py-0.5 rounded shadow text-white whitespace-nowrap">
            Net: {formatTaka(netSavings)}
          </div>
          <div
            className={`w-10 rounded-t transition-all duration-300 group-hover:brightness-110 shadow-xs ${
              netSavings >= 0 ? 'bg-[#55C79A]' : 'bg-[#EF4444]'
            }`}
            style={{ height: `${Math.max(6, netPct)}%` }}
          />
          <span className={`text-[10px] font-medium mt-1.5 ${isDark ? 'text-[#87948C]' : 'text-slate-500'}`}>
            Net
          </span>
        </div>
      </div>

      {/* 3-Column Text Summary below chart */}
      <div className={`grid grid-cols-3 gap-2 p-2.5 rounded-lg border mt-3 text-center ${
        isDark ? 'bg-[#0C0E12] border-[#3D4943]/30' : 'bg-slate-50 border-slate-200'
      }`}>
        <div>
          <span className={`text-[10px] uppercase tracking-wider block ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
            Earnings
          </span>
          <span className={`text-xs font-mono font-bold mt-0.5 block ${isDark ? 'text-[#73E3B4]' : 'text-emerald-700'}`}>
            {formatTaka(totalEarned)}
          </span>
        </div>

        <div>
          <span className={`text-[10px] uppercase tracking-wider block ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
            Spent
          </span>
          <span className={`text-xs font-mono font-bold mt-0.5 block ${isDark ? 'text-[#FFB4AB]' : 'text-rose-600'}`}>
            {formatTaka(totalSpent)}
          </span>
        </div>

        <div>
          <span className={`text-[10px] uppercase tracking-wider block ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
            Net
          </span>
          <span
            className={`text-xs font-mono font-bold mt-0.5 block ${
              netSavings >= 0
                ? isDark ? 'text-[#73E3B4]' : 'text-emerald-600'
                : isDark ? 'text-[#FFB4AB]' : 'text-rose-600'
            }`}
          >
            {formatTaka(netSavings)}
          </span>
        </div>
      </div>
    </div>
  );
};
