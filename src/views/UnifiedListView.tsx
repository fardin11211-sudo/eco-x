import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Users2,
  Trash2,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Wallet,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import {
  UnifiedActivityItem,
  PaymentMethod,
  PersonRecord
} from '../domain/types';
import { formatTaka } from '../domain/money';
import { formatDisplayDate } from '../domain/dates';
import { ConfirmModal } from '../components/ui/ConfirmModal';

interface UnifiedListViewProps {
  activities: UnifiedActivityItem[];
  paymentMethods: PaymentMethod[];
  people: PersonRecord[];
  categories: string[];
  onDeleteActivity: (activity: UnifiedActivityItem) => void;
  onOpenAddModal: () => void;
}

export const UnifiedListView: React.FC<UnifiedListViewProps> = ({
  activities,
  paymentMethods,
  people,
  categories,
  onDeleteActivity,
  onOpenAddModal
}) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  // Selected item for details drawer & non-blocking delete
  const [detailItem, setDetailItem] = useState<UnifiedActivityItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<UnifiedActivityItem | null>(null);

  // Pagination
  const [visibleCount, setVisibleCount] = useState<number>(30);

  // Filter pipeline
  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      // 1. Type filter
      if (selectedType !== 'all') {
        if (selectedType === 'expense' && item.activityType !== 'expense' && item.activityType !== 'recurring') {
          return false;
        }
        if (selectedType !== 'expense' && item.activityType !== selectedType) {
          return false;
        }
      }

      // 2. Method filter
      if (selectedMethodId !== 'all') {
        const matchesMethod =
          item.payMethodId === selectedMethodId ||
          item.fromMethodId === selectedMethodId ||
          item.toMethodId === selectedMethodId;
        if (!matchesMethod) return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'all' && item.activityType === 'expense') {
        if (item.categoryOrSourceOrPerson !== selectedCategory) return false;
      }

      // 4. Person filter
      if (selectedPersonId !== 'all' && item.activityType === 'transaction') {
        const raw: any = item.rawRecord;
        if (raw.personId !== selectedPersonId) return false;
      }

      // 5. Date filter
      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (item.date !== todayStr) return false;
      } else if (dateFilter === 'month') {
        const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
        if (!item.date.startsWith(currentMonth)) return false;
      }

      // 6. Search text
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(term);
        const matchDesc = item.description.toLowerCase().includes(term);
        const matchCat = item.categoryOrSourceOrPerson.toLowerCase().includes(term);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [
    activities,
    selectedType,
    selectedMethodId,
    selectedCategory,
    selectedPersonId,
    dateFilter,
    searchTerm
  ]);

  const pagedList = filteredActivities.slice(0, visibleCount);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedMethodId('all');
    setSelectedCategory('all');
    setSelectedPersonId('all');
    setDateFilter('all');
  };

  const hasActiveFilters =
    searchTerm ||
    selectedType !== 'all' ||
    selectedMethodId !== 'all' ||
    selectedCategory !== 'all' ||
    selectedPersonId !== 'all' ||
    dateFilter !== 'all';

  return (
    <div className="space-y-4 pb-28 lg:pb-12 animate-in fade-in duration-150">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#E2E2E8]">Ledger History</h2>
          <p className="text-xs text-[#BCCAC1]">
            Chronological record of all expenses, income, transfers, and personal loans
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="self-start sm:self-auto px-4 py-2 bg-[#55C79A] hover:bg-[#73E3B4] active:scale-[0.98] text-[#003826] font-semibold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
        >
          + Record Entry
        </button>
      </div>

      {/* --- Filter Controls Card --- */}
      <div className="bg-[#1A1C20] border border-[#3D4943]/40 rounded-xl p-4 space-y-3 shadow-sm">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#87948C] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by description, person, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] placeholder-[#87948C] focus:outline-none focus:border-[#73E3B4] transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-[#87948C] hover:text-[#E2E2E8] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Activity Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'expense', label: 'Expenses' },
            { id: 'earning', label: 'Earnings' },
            { id: 'transfer', label: 'Transfers' },
            { id: 'transaction', label: 'Loans & Debts' }
          ].map((tab) => {
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1E2024] text-[#73E3B4] border border-[#73E3B4]/40 font-semibold'
                    : 'text-[#BCCAC1] hover:text-[#E2E2E8] hover:bg-[#0C0E12]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Secondary Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-[#3D4943]/20">
          {/* Wallets Filter */}
          <select
            value={selectedMethodId}
            onChange={(e) => setSelectedMethodId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-[#E2E2E8] focus:outline-none focus:border-[#73E3B4] cursor-pointer text-xs"
          >
            <option value="all">All Wallets</option>
            {paymentMethods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1 bg-[#0C0E12] p-1 rounded-lg border border-[#3D4943]/50">
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                dateFilter === 'all' ? 'bg-[#1E2024] text-[#73E3B4] font-medium' : 'text-[#87948C] hover:text-[#E2E2E8]'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('month')}
              className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                dateFilter === 'month' ? 'bg-[#1E2024] text-[#73E3B4] font-medium' : 'text-[#87948C] hover:text-[#E2E2E8]'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                dateFilter === 'today' ? 'bg-[#1E2024] text-[#73E3B4] font-medium' : 'text-[#87948C] hover:text-[#E2E2E8]'
              }`}
            >
              Today
            </button>
          </div>

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-[#FFB4AB] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* --- Activities Table / Rows --- */}
      <div className="bg-[#1A1C20] border border-[#3D4943]/40 rounded-xl overflow-hidden divide-y divide-[#3D4943]/20 shadow-sm">
        {pagedList.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#87948C] space-y-2">
            <div>No matching records found.</div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[#73E3B4] hover:underline font-medium cursor-pointer"
              >
                Clear active filters
              </button>
            )}
          </div>
        ) : (
          pagedList.map((item) => {
            const isExpense = item.activityType === 'expense' || item.activityType === 'recurring';
            const isEarning = item.activityType === 'earning';
            const isTransfer = item.activityType === 'transfer';
            const isGive = item.activityType === 'transaction' && item.direction === 'give';
            const isTake = item.activityType === 'transaction' && item.direction === 'take';

            const methodObj = paymentMethods.find((m) => m.id === item.payMethodId);

            return (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                className="p-3.5 flex items-center justify-between hover:bg-[#1E2024]/70 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Semantic Icon Badge */}
                  <div className="p-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/30 shrink-0">
                    {isExpense && <TrendingDown className="w-4 h-4 text-[#FFB4AB]" />}
                    {isEarning && <TrendingUp className="w-4 h-4 text-[#73E3B4]" />}
                    {isTransfer && <ArrowRightLeft className="w-4 h-4 text-[#BEC7D5]" />}
                    {isGive && <ArrowUpRight className="w-4 h-4 text-[#73E3B4]" />}
                    {isTake && <ArrowDownRight className="w-4 h-4 text-[#FFB4AB]" />}
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#E2E2E8] group-hover:text-[#73E3B4] transition-colors truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#87948C] flex items-center gap-2 mt-0.5 truncate">
                      <span className="font-mono text-[10px] text-[#BCCAC1]">
                        {formatDisplayDate(item.date)}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{item.categoryOrSourceOrPerson}</span>
                      {methodObj && (
                        <>
                          <span>·</span>
                          <span className="text-[#87948C]">{methodObj.name}</span>
                        </>
                      )}
                      {item.description && (
                        <>
                          <span>·</span>
                          <span className="truncate italic max-w-[180px]">{item.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount in Monospace Tabular Figures */}
                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                  <div className="text-right">
                    <div
                      className={`text-xs font-mono tabular-nums font-bold ${
                        isExpense || isTake
                          ? 'text-[#FFB4AB]'
                          : isEarning || isGive
                          ? 'text-[#73E3B4]'
                          : 'text-[#E2E2E8]'
                      }`}
                    >
                      {isExpense || isTake ? '-' : isEarning || isGive ? '+' : ''}
                      {formatTaka(item.amount)}
                    </div>
                    {item.netEffectText && (
                      <div className="text-[10px] text-[#87948C]">{item.netEffectText}</div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#87948C] group-hover:text-[#E2E2E8] transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More Button */}
      {filteredActivities.length > visibleCount && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 30)}
            className="px-5 py-2 rounded-lg bg-[#1A1C20] hover:bg-[#282A2E] border border-[#3D4943]/50 text-xs text-[#BCCAC1] hover:text-[#E2E2E8] transition-colors cursor-pointer"
          >
            Load More Transactions ({filteredActivities.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* =========================================================================
          PROGRESSIVE DISCLOSURE: TRANSACTION DETAILS MODAL
         ========================================================================= */}
      {detailItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailItem(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#1A1C20] border border-[#3D4943]/60 rounded-xl p-5 shadow-2xl flex flex-col space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#3D4943]/30 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#73E3B4]" />
                <h3 className="text-sm font-semibold text-[#E2E2E8]">Transaction Audit Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amount Banner */}
            <div className="p-4 rounded-lg bg-[#0C0E12] border border-[#3D4943]/30 text-center">
              <div className="text-[11px] text-[#87948C] uppercase tracking-wider">
                {detailItem.activityType.toUpperCase()}
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-[#E2E2E8] mt-1">
                {formatTaka(detailItem.amount)}
              </div>
              <div className="text-xs text-[#BCCAC1] mt-0.5">{detailItem.title}</div>
            </div>

            {/* Field Breakdown List */}
            <div className="divide-y divide-[#3D4943]/20 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-[#87948C]">Date</span>
                <span className="font-mono text-[#E2E2E8]">{formatDisplayDate(detailItem.date)}</span>
              </div>

              <div className="py-2 flex items-center justify-between">
                <span className="text-[#87948C]">Category / Party</span>
                <span className="font-medium text-[#E2E2E8]">{detailItem.categoryOrSourceOrPerson}</span>
              </div>

              {detailItem.payMethodId && (
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#87948C]">Wallet Account</span>
                  <span className="text-[#73E3B4] font-medium">
                    {paymentMethods.find((m) => m.id === detailItem.payMethodId)?.name || 'Account'}
                  </span>
                </div>
              )}

              {detailItem.fromMethodId && (
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#87948C]">From Wallet</span>
                  <span className="text-[#E2E2E8]">
                    {paymentMethods.find((m) => m.id === detailItem.fromMethodId)?.name || 'Source'}
                  </span>
                </div>
              )}

              {detailItem.toMethodId && (
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#87948C]">To Wallet</span>
                  <span className="text-[#E2E2E8]">
                    {paymentMethods.find((m) => m.id === detailItem.toMethodId)?.name || 'Destination'}
                  </span>
                </div>
              )}

              {detailItem.feeAmount !== undefined && detailItem.feeAmount > 0 && (
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#87948C]">Transfer Charge Applied</span>
                  <span className="font-mono tabular-nums text-[#FFB4AB]">{formatTaka(detailItem.feeAmount)}</span>
                </div>
              )}

              {detailItem.description && (
                <div className="py-2 space-y-1">
                  <span className="text-[#87948C] block">Notes & Description</span>
                  <p className="text-xs text-[#E2E2E8] bg-[#0C0E12] p-2 rounded border border-[#3D4943]/20">
                    {detailItem.description}
                  </p>
                </div>
              )}

              <div className="py-2 flex items-center justify-between text-[11px] text-[#87948C]">
                <span>Record ID</span>
                <span className="font-mono">{detailItem.id}</span>
              </div>
            </div>

            {/* Actions: Close & Delete */}
            <div className="pt-3 border-t border-[#3D4943]/30 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setItemToDelete(detailItem);
                  setDetailItem(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#FFB4AB]/10 hover:bg-[#FFB4AB]/20 text-[#FFB4AB] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-4 py-1.5 rounded-lg bg-[#282A2E] hover:bg-[#333539] text-xs text-[#E2E2E8] font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Transaction Record"
          message={`Are you sure you want to delete "${itemToDelete.title}" (${formatTaka(itemToDelete.amount)})? This will reverse all financial ledger and wallet balance effects.`}
          confirmLabel="Delete Record"
          cancelLabel="Keep Record"
          isDestructive={true}
          onConfirm={() => {
            onDeleteActivity(itemToDelete);
            setItemToDelete(null);
          }}
          onCancel={() => setItemToDelete(null)}
        />
      )}
    </div>
  );
};
