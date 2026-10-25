import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsChartCardProps {
  title: string;
  icon: LucideIcon;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  fixedHeightClass?: string; // defaults to h-[260px]
  theme?: 'dark' | 'light';
  emptyMessage?: string;
  isEmpty?: boolean;
}

export const StatsChartCard: React.FC<StatsChartCardProps> = ({
  title,
  icon: Icon,
  subtitle,
  action,
  children,
  fixedHeightClass = 'h-[260px]',
  theme = 'dark',
  emptyMessage,
  isEmpty = false
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col justify-between transition-colors shadow-sm ${
        isDark ? 'bg-[#1A1C20] border-[#3D4943]/40' : 'bg-white border-slate-200 shadow-slate-100'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isDark ? 'bg-[#0C0E12] text-[#73E3B4] border border-[#3D4943]/40' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#E2E2E8]' : 'text-slate-800'}`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`text-[11px] ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Body with fixed height container */}
      <div className={`relative w-full ${fixedHeightClass} flex flex-col justify-center items-center overflow-hidden`}>
        {isEmpty ? (
          <div className="text-center py-6">
            <p className={`text-xs ${isDark ? 'text-[#87948C]' : 'text-slate-400'}`}>
              {emptyMessage || 'No data recorded for this period.'}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
