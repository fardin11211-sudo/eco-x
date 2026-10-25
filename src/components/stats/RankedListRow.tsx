import React from 'react';
import { formatTaka } from '../../domain/money';

interface RankedListRowProps {
  rank: number;
  name: string;
  amount: number;
  maxAmount: number;
  totalAmount?: number;
  percentage?: number;
  color?: string;
  theme?: 'dark' | 'light';
  showPercentage?: boolean;
}

export const RankedListRow: React.FC<RankedListRowProps> = ({
  rank,
  name,
  amount,
  maxAmount,
  percentage,
  color = '#73E3B4',
  theme = 'dark',
  showPercentage = true
}) => {
  const isDark = theme === 'dark';
  const barWidth = maxAmount > 0 ? Math.min(100, Math.max(4, Math.round((amount / maxAmount) * 100))) : 0;

  return (
    <div className="space-y-1 py-1.5 transition-colors">
      <div className="flex items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Rank Badge with slice color */}
          <span
            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0 text-white shadow-xs"
            style={{ backgroundColor: color }}
          >
            #{rank}
          </span>
          <span className={`font-medium truncate ${isDark ? 'text-[#E2E2E8]' : 'text-slate-800'}`}>
            {name}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`font-mono tabular-nums font-semibold ${isDark ? 'text-[#E2E2E8]' : 'text-slate-900'}`}>
            {formatTaka(amount)}
          </span>
          {showPercentage && percentage !== undefined && (
            <span
              className="text-[11px] font-mono tabular-nums w-10 text-right font-medium"
              style={{ color }}
            >
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Thin Progress Bar relative to Top Category */}
      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#0C0E12]' : 'bg-slate-100'}`}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${barWidth}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};
