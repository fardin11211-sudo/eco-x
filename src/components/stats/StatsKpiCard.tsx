import React from 'react';

interface StatsKpiCardProps {
  label: string;
  value: string | number;
  subline: React.ReactNode;
  accentColor?: string; // hex or tailwind class for top bar
  theme?: 'dark' | 'light';
}

export const StatsKpiCard: React.FC<StatsKpiCardProps> = ({
  label,
  value,
  subline,
  accentColor = '#73E3B4',
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 flex flex-col justify-between transition-colors shadow-sm ${
        isDark ? 'bg-[#1A1C20] border-[#3D4943]/40' : 'bg-white border-slate-200 shadow-slate-100'
      }`}
    >
      {/* Colored Top Accent Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-all"
        style={{ backgroundColor: accentColor }}
      />

      <div className="pt-0.5">
        <span className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-[#BCCAC1]' : 'text-slate-500'}`}>
          {label}
        </span>
        <div
          className={`text-xl sm:text-2xl font-mono tabular-nums font-bold mt-1.5 tracking-tight ${
            isDark ? 'text-[#E2E2E8]' : 'text-slate-900'
          }`}
        >
          {value}
        </div>
      </div>

      <div className={`text-[11px] mt-2.5 pt-1.5 border-t ${isDark ? 'border-[#3D4943]/20 text-[#87948C]' : 'border-slate-100 text-slate-500'}`}>
        {subline}
      </div>
    </div>
  );
};
