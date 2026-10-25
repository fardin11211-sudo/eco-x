import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Calendar, TrendingDown } from 'lucide-react';
import { BudgetMetrics } from '../domain/calculations';
import { formatTaka } from '../domain/money';

interface FixedEmergencyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: BudgetMetrics;
  onNavigateToSettings?: () => void;
}

export const FixedEmergencyDetailsModal: React.FC<FixedEmergencyDetailsModalProps> = ({
  isOpen,
  onClose,
  metrics,
  onNavigateToSettings
}) => {
  if (!isOpen) return null;

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Calculation percentage bars
  const fixedPct = metrics.plannedFixed > 0
    ? Math.min(100, Math.round((metrics.actualFixed / metrics.plannedFixed) * 100))
    : metrics.actualFixed > 0 ? 100 : 0;

  const emergencyPct = metrics.plannedEmergency > 0
    ? Math.min(100, Math.round((metrics.actualEmergency / metrics.plannedEmergency) * 100))
    : metrics.actualEmergency > 0 ? 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#111317] border border-[#3D4943]/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#3D4943]/30 flex items-center justify-between bg-[#1A1C20]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0C0E12] border border-[#73E3B4]/40 flex items-center justify-center text-[#73E3B4]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#E2E2E8]">
                Fixed & Emergency Budget Details
              </h2>
              <p className="text-[11px] text-[#87948C]">
                Adaptive tracking for {currentMonthName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#87948C] hover:text-[#E2E2E8] hover:bg-[#0C0E12] transition-colors"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Section 1: Fixed Costs */}
          <div className="p-4 rounded-xl bg-[#1A1C20] border border-[#3D4943]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#E2E2E8]">1. Fixed Costs (Bills & Rent)</span>
                {metrics.isFixedOver ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#93000A]/30 text-[#FFB4AB] border border-[#FFB4AB]/40 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    Over by {formatTaka(metrics.fixedOverAmount)}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#003826]/40 text-[#73E3B4] border border-[#73E3B4]/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Within Plan
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#87948C]">Planned: </span>
                <span className="font-mono text-[#E2E2E8] font-medium">{formatTaka(metrics.plannedFixed)}</span>
              </div>
              <div className="text-right">
                <span className="text-[#87948C]">Spent this month: </span>
                <span className={`font-mono font-medium ${metrics.isFixedOver ? 'text-[#FFB4AB]' : 'text-[#73E3B4]'}`}>
                  {formatTaka(metrics.actualFixed)}
                </span>
              </div>
            </div>

            {/* Visual progress bar */}
            <div className="w-full h-2 rounded-full bg-[#0C0E12] border border-[#3D4943]/30 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.isFixedOver ? 'bg-[#FFB4AB]' : 'bg-[#73E3B4]'
                }`}
                style={{ width: `${Math.min(100, fixedPct)}%` }}
              />
            </div>

            {metrics.isFixedOver ? (
              <p className="text-[11px] text-[#FFB4AB] leading-relaxed bg-[#93000A]/10 p-2 rounded border border-[#FFB4AB]/20">
                ⚠️ Fixed spending exceeded the plan by {formatTaka(metrics.fixedOverAmount)}. This higher actual amount is now deducted in the adaptive formula to safely preserve your remaining bills.
              </p>
            ) : (
              <p className="text-[11px] text-[#87948C] leading-relaxed">
                ✓ {formatTaka(Math.max(0, metrics.plannedFixed - metrics.actualFixed))} remains safely reserved for pending bills this month and does not leak into daily spending.
              </p>
            )}
          </div>

          {/* Section 2: Emergency Fund */}
          <div className="p-4 rounded-xl bg-[#1A1C20] border border-[#3D4943]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#E2E2E8]">2. Emergency Money</span>
                {metrics.isEmergencyOver ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#93000A]/30 text-[#FFB4AB] border border-[#FFB4AB]/40 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    Over by {formatTaka(metrics.emergencyOverAmount)}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#003826]/40 text-[#73E3B4] border border-[#73E3B4]/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Protected
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#87948C]">Planned Reserve: </span>
                <span className="font-mono text-[#E2E2E8] font-medium">{formatTaka(metrics.plannedEmergency)}</span>
              </div>
              <div className="text-right">
                <span className="text-[#87948C]">Spent this month: </span>
                <span className={`font-mono font-medium ${metrics.isEmergencyOver ? 'text-[#FFB4AB]' : 'text-[#73E3B4]'}`}>
                  {formatTaka(metrics.actualEmergency)}
                </span>
              </div>
            </div>

            {/* Visual progress bar */}
            <div className="w-full h-2 rounded-full bg-[#0C0E12] border border-[#3D4943]/30 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.isEmergencyOver ? 'bg-[#FFB4AB]' : 'bg-[#73E3B4]'
                }`}
                style={{ width: `${Math.min(100, emergencyPct)}%` }}
              />
            </div>

            {metrics.isEmergencyOver ? (
              <p className="text-[11px] text-[#FFB4AB] leading-relaxed bg-[#93000A]/10 p-2 rounded border border-[#FFB4AB]/20">
                ⚠️ Emergency costs exceeded the planned reserve by {formatTaka(metrics.emergencyOverAmount)}. The extra is automatically subtracted from monthly spendable money.
              </p>
            ) : (
              <p className="text-[11px] text-[#87948C] leading-relaxed">
                ✓ {formatTaka(Math.max(0, metrics.plannedEmergency - metrics.actualEmergency))} remains safeguarded for urgent medical, repair, or unplanned events.
              </p>
            )}
          </div>

          {/* Section 3: Adaptive Formula Breakdown */}
          <div className="p-4 rounded-xl bg-[#0C0E12] border border-[#3D4943]/40 space-y-2 font-mono text-[11px]">
            <div className="text-xs font-sans font-semibold text-[#73E3B4] mb-1">
              Monthly Budget Computation
            </div>
            <div className="flex justify-between py-1 border-b border-[#3D4943]/20">
              <span className="text-[#87948C]">Monthly Income:</span>
              <span className="font-bold text-[#E2E2E8]">{formatTaka(metrics.income)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#3D4943]/20">
              <span className="text-[#87948C]">Fixed Used:</span>
              <span className="text-[#FFB4AB]">- {formatTaka(metrics.fixedUsed)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#3D4943]/20">
              <span className="text-[#87948C]">Emergency Used:</span>
              <span className="text-[#FFB4AB]">- {formatTaka(metrics.emergencyUsed)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#3D4943]/20">
              <span className="text-[#87948C]">Savings Target:</span>
              <span className="text-[#FFB4AB]">- {formatTaka(metrics.plannedSavings)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#3D4943]/20">
              <span className="text-[#87948C]">Buffer ({metrics.bufferPct}%):</span>
              <span className="text-[#FFB4AB]">- {formatTaka(metrics.bufferAmount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#3D4943]/40 text-xs font-bold">
              <span className="text-[#BCCAC1]">Total Monthly Spendable:</span>
              <span className="text-[#73E3B4]">{formatTaka(metrics.spendable)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#3D4943]/20">
              <span className="text-[#87948C]">Regular Spent (before today):</span>
              <span className="text-[#FFB4AB]">- {formatTaka(metrics.priorRegularSpend)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#3D4943]/40 text-xs font-bold">
              <span className="text-[#BCCAC1]">Remaining Spendable:</span>
              <span className="text-[#73E3B4]">{formatTaka(metrics.remainingSpendable)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-xs font-bold text-white bg-[#1A1C20] px-2 rounded">
              <span>Today's Limit ({metrics.daysLeft} days left):</span>
              <span className="text-[#73E3B4] font-mono">{formatTaka(metrics.todayLimit)} / day</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#3D4943]/30 bg-[#1A1C20] flex items-center justify-between">
          {onNavigateToSettings ? (
            <button
              onClick={() => {
                onClose();
                onNavigateToSettings();
              }}
              className="text-xs text-[#73E3B4] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <span>Edit Budget in Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0C0E12] hover:bg-[#1E2024] border border-[#3D4943]/40 text-xs text-[#E2E2E8] font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
