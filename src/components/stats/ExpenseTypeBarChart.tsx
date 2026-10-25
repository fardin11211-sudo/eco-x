import React from 'react';
import { ExpenseTypeStat } from '../../domain/statistics';
import { formatTaka } from '../../domain/money';

interface ExpenseTypeBarChartProps {
  types: ExpenseTypeStat[];
  theme?: 'dark' | 'light';
}

export const ExpenseTypeBarChart: React.FC<ExpenseTypeBarChartProps> = ({
  types,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const total = types.reduce((sum, t) => sum + t.amount, 0);

  if (total <= 0) {
    return (
      <div className={`text-center py-8 text-xs ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
        No categorized expenses recorded in this period.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between py-2 space-y-4">
      {/* Visual Stacked Bar */}
      <div className={`w-full h-4 rounded-lg overflow-hidden flex border ${
        isDark ? 'bg-[#0C0E12] border-[#3D4943]/40' : 'bg-slate-100 border-slate-200'
      }`}>
        {types.map((t) => (
          <div
            key={t.label}
            className="h-full transition-all duration-300 hover:brightness-110"
            style={{ width: `${t.percentage}%`, backgroundColor: t.color }}
            title={`${t.label}: ${formatTaka(t.amount)} (${t.percentage}%)`}
          />
        ))}
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {types.map((t) => (
          <div
            key={t.label}
            className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
              isDark ? 'bg-[#0C0E12] border-[#3D4943]/30' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: t.color }}
              />
              <span className={`text-[11px] font-medium truncate ${isDark ? 'text-[#BCCAC1]' : 'text-slate-600'}`}>
                {t.label}
              </span>
            </div>

            <div className={`text-sm sm:text-base font-mono tabular-nums font-bold tracking-tight ${
              isDark ? 'text-[#E2E2E8]' : 'text-slate-900'
            }`}>
              {formatTaka(t.amount)}
            </div>

            <div className="text-[10px] font-mono tabular-nums font-semibold mt-1" style={{ color: t.color }}>
              {t.percentage}% of total
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
