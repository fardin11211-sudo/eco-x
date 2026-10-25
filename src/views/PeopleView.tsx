import React, { useState, useEffect, useMemo } from 'react';
import {
  Users2,
  Plus,
  MessageCircle,
  Share2,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  Info,
  Link2,
  UserCheck,
  Send,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  Search,
  SlidersHorizontal,
  HandCoins,
  Receipt,
  Pencil
} from 'lucide-react';
import {
  PersonRecord,
  PeerTransactionRecord,
  PaymentMethod,
  EcOConnection,
  EcOProposal,
  ConnectionStatus
} from '../domain/types';
import { formatTaka } from '../domain/money';
import { formatDisplayDate, getTodayDateString } from '../domain/dates';
import { buildBanglaWhatsAppReminder, normalizeWhatsAppPhone } from '../domain/milestones';
import { invertProposalDirection } from '../domain/connections';

interface PeopleViewProps {
  people: PersonRecord[];
  transactions: PeerTransactionRecord[];
  paymentMethods: PaymentMethod[];
  personBalances: Map<string, number>;
  connections?: EcOConnection[];
  proposals?: EcOProposal[];
  myConnectionCode?: string;
  onAddPerson: (name: string, phone?: string) => void;
  onUpdatePerson?: (person: PersonRecord) => void;
  onDeletePerson: (personId: string) => void;
  onOpenAddPeerTransaction: (personId: string) => void;
  onGenerateShareLink: (personId: string) => string;
  onCreateConnection?: (code: string, peerName: string) => void;
  onUpdateConnectionStatus?: (connectionId: string, status: ConnectionStatus) => void;
  onDeleteConnection?: (connectionId: string) => void;
  onCreateProposal?: (
    recipientCode: string,
    recipientName: string,
    type: 'give' | 'take',
    amount: number,
    date: string,
    note?: string
  ) => void;
  onAcceptProposal?: (proposalId: string, payMethodId: string) => void;
  onRejectProposal?: (proposalId: string) => void;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  people,
  transactions,
  paymentMethods,
  personBalances,
  connections = [],
  proposals = [],
  myConnectionCode = 'ECO-USER',
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
  onOpenAddPeerTransaction,
  onGenerateShareLink,
  onCreateConnection,
  onUpdateConnectionStatus,
  onDeleteConnection,
  onCreateProposal,
  onAcceptProposal,
  onRejectProposal
}) => {
  // Top sub-tab: 'local' (People ledgers) vs 'connections' (EcO-to-EcO)
  const [activeTab, setActiveTab] = useState<'local' | 'connections'>('local');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'receivable' | 'payable' | 'settled'>('all');

  // Modal states
  const [showAddPersonModal, setShowAddPersonModal] = useState<boolean>(false);
  const [newPersonName, setNewPersonName] = useState<string>('');
  const [newPersonPhone, setNewPersonPhone] = useState<string>('');
  const [addPersonError, setAddPersonError] = useState<string | null>(null);

  // Edit Person modal state
  const [editingPerson, setEditingPerson] = useState<PersonRecord | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Selected person for ledger detail view
  const [selectedPerson, setSelectedPerson] = useState<PersonRecord | null>(null);

  // WhatsApp reminder modal
  const [whatsappPerson, setWhatsappPerson] = useState<PersonRecord | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [whatsappMessage, setWhatsappMessage] = useState<string>('');
  const [copiedReminder, setCopiedReminder] = useState<boolean>(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  // Share link modal
  const [shareLinkPerson, setShareLinkPerson] = useState<PersonRecord | null>(null);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string>('');
  const [copiedShareUrl, setCopiedShareUrl] = useState<boolean>(false);

  // EcO-to-EcO Connection Modals
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [connectCodeInput, setConnectCodeInput] = useState<string>('');
  const [connectNameInput, setConnectNameInput] = useState<string>('');
  const [connectError, setConnectError] = useState<string | null>(null);
  const [copiedMyCode, setCopiedMyCode] = useState<boolean>(false);

  // Proposal Creation Modal
  const [showProposeModal, setShowProposeModal] = useState<boolean>(false);
  const [proposalPeer, setProposalPeer] = useState<EcOConnection | null>(null);
  const [proposalType, setProposalType] = useState<'give' | 'take'>('give');
  const [proposalAmountStr, setProposalAmountStr] = useState<string>('');
  const [proposalDate, setProposalDate] = useState<string>(getTodayDateString());
  const [proposalNote, setProposalNote] = useState<string>('');
  const [proposalError, setProposalError] = useState<string | null>(null);

  // Proposal Acceptance Modal (Pick Wallet)
  const [acceptingProposal, setAcceptingProposal] = useState<EcOProposal | null>(null);
  const [selectedWalletForAccept, setSelectedWalletForAccept] = useState<string>(paymentMethods[0]?.id || '');

  // Global Escape key listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingPerson) setEditingPerson(null);
        else if (acceptingProposal) setAcceptingProposal(null);
        else if (showProposeModal) setShowProposeModal(false);
        else if (showConnectModal) setShowConnectModal(false);
        else if (whatsappPerson) setWhatsappPerson(null);
        else if (shareLinkPerson) setShareLinkPerson(null);
        else if (selectedPerson) setSelectedPerson(null);
        else if (showAddPersonModal) setShowAddPersonModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    editingPerson,
    acceptingProposal,
    showProposeModal,
    showConnectModal,
    whatsappPerson,
    shareLinkPerson,
    selectedPerson,
    showAddPersonModal
  ]);

  // Aggregate receivables and payables
  const { totalReceivable, totalPayable, netPeerPosition } = useMemo(() => {
    let rec = 0;
    let pay = 0;
    people.forEach((p) => {
      const b = personBalances.get(p.id) || 0;
      if (b > 0) rec += b;
      else if (b < 0) pay += Math.abs(b);
    });
    return {
      totalReceivable: rec,
      totalPayable: pay,
      netPeerPosition: rec - pay
    };
  }, [people, personBalances]);

  // Filtered people list
  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q));
      if (!matchSearch) return false;

      // Status filter
      const balance = personBalances.get(p.id) || 0;
      if (filterType === 'receivable') return balance > 0;
      if (filterType === 'payable') return balance < 0;
      if (filterType === 'settled') return balance === 0;
      return true;
    });
  }, [people, searchQuery, filterType, personBalances]);

  // Filter transactions for selected person
  const personTransactions = useMemo(() => {
    if (!selectedPerson) return [];
    return transactions.filter((t) => t.personId === selectedPerson.id);
  }, [selectedPerson, transactions]);

  const handleCreatePerson = () => {
    const trimmed = newPersonName.trim();
    if (!trimmed) {
      setAddPersonError('Please provide a person name.');
      return;
    }
    const duplicate = people.some((p) => p.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      setAddPersonError(`A person named "${trimmed}" already exists in your ledger.`);
      return;
    }
    setAddPersonError(null);
    onAddPerson(trimmed, newPersonPhone.trim() || undefined);
    setNewPersonName('');
    setNewPersonPhone('');
    setShowAddPersonModal(false);
  };

  const handleOpenEditPerson = (p: PersonRecord) => {
    setEditingPerson(p);
    setEditName(p.name);
    setEditPhone(p.phone || '');
    setEditError(null);
    setEditSuccess(null);
    setIsSavingEdit(false);
  };

  const handleSaveEditPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('Person display name is required.');
      return;
    }
    const duplicate = people.some(
      (p) => p.id !== editingPerson.id && p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setEditError(`Another person named "${trimmed}" already exists.`);
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    try {
      const updated: PersonRecord = {
        ...editingPerson,
        name: trimmed,
        phone: editPhone.trim() || undefined,
      };
      if (onUpdatePerson) {
        onUpdatePerson(updated);
      }
      setEditSuccess('Person details updated successfully.');
      setTimeout(() => {
        setIsSavingEdit(false);
        setEditingPerson(null);
        setEditSuccess(null);
      }, 500);
    } catch (err: any) {
      setIsSavingEdit(false);
      setEditError(err?.message || 'Failed to update person.');
    }
  };

  const handleOpenWhatsAppReminder = (p: PersonRecord) => {
    const balance = personBalances.get(p.id) || 0;
    const owedAmount = Math.max(0, balance);
    const phone = p.phone ? normalizeWhatsAppPhone(p.phone) : '';
    setWhatsappPerson(p);
    setWhatsappPhone(phone);
    setWhatsappError(null);

    const giveTxs = transactions.filter((t) => t.personId === p.id && t.type === 'give');
    const recordedDate = giveTxs[0]?.date || getTodayDateString();

    const politeText = buildBanglaWhatsAppReminder(
      p.name,
      owedAmount,
      'কিছুদিন',
      recordedDate
    );
    setWhatsappMessage(politeText);
    setCopiedReminder(false);
  };

  const handleCopyAndLaunchWhatsApp = () => {
    const cleanNumber = normalizeWhatsAppPhone(whatsappPhone);
    if (!cleanNumber) {
      setWhatsappError('Please provide a valid phone number (e.g. 017XXXXXXXX or +88017...).');
      return;
    }
    setWhatsappError(null);

    navigator.clipboard.writeText(whatsappMessage);
    setCopiedReminder(true);

    const encodedMsg = encodeURIComponent(whatsappMessage);
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMsg}`;

    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenShareModal = (p: PersonRecord) => {
    const token = onGenerateShareLink(p.id);
    const fullUrl = `${window.location.origin}/?share=${token}`;
    setShareLinkPerson(p);
    setGeneratedShareUrl(fullUrl);
    setCopiedShareUrl(false);
  };

  const handleCopyMyCode = () => {
    navigator.clipboard.writeText(myConnectionCode);
    setCopiedMyCode(true);
    setTimeout(() => setCopiedMyCode(false), 2000);
  };

  const handleSendConnectionRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setConnectError(null);

    const code = connectCodeInput.trim().toUpperCase();
    const name = connectNameInput.trim();

    if (!code) {
      setConnectError('Please enter the recipient’s EcO connection code.');
      return;
    }
    if (code === myConnectionCode) {
      setConnectError('You cannot connect with your own connection code.');
      return;
    }
    if (!name) {
      setConnectError('Please enter a display name for this connection.');
      return;
    }

    onCreateConnection?.(code, name);
    setConnectCodeInput('');
    setConnectNameInput('');
    setShowConnectModal(false);
  };

  const handleOpenProposeForPeer = (peer: EcOConnection) => {
    setProposalPeer(peer);
    setProposalAmountStr('');
    setProposalNote('');
    setProposalError(null);
    setProposalDate(getTodayDateString());
    setShowProposeModal(true);
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setProposalError(null);

    const amount = parseFloat(proposalAmountStr);
    if (isNaN(amount) || amount <= 0) {
      setProposalError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!proposalPeer) return;

    onCreateProposal?.(
      proposalPeer.peerCode,
      proposalPeer.peerName,
      proposalType,
      amount,
      proposalDate,
      proposalNote.trim() || undefined
    );

    setShowProposeModal(false);
  };

  const handleConfirmAcceptProposal = () => {
    if (!acceptingProposal) return;
    if (!selectedWalletForAccept) return;
    onAcceptProposal?.(acceptingProposal.id, selectedWalletForAccept);
    setAcceptingProposal(null);
  };

  const pendingIncomingProposals = proposals.filter((p) => p.status === 'pending');

  return (
    <div className="space-y-6 pb-28 lg:pb-12 animate-in fade-in duration-150">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#E2E2E8] tracking-tight">People & Debt Ledgers</h2>
          <p className="text-xs text-[#BCCAC1] mt-0.5">
            Track receivables, personal payables, and optional EcO-to-EcO linked accounts
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#1A1C20] p-1 rounded-xl border border-[#3D4943]/40 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors font-medium ${
              activeTab === 'local'
                ? 'bg-[#0C0E12] text-[#73E3B4] shadow-sm'
                : 'text-[#87948C] hover:text-[#E2E2E8]'
            }`}
          >
            People Ledgers ({people.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('connections')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors font-medium flex items-center gap-1.5 ${
              activeTab === 'connections'
                ? 'bg-[#0C0E12] text-[#73E3B4] shadow-sm'
                : 'text-[#87948C] hover:text-[#E2E2E8]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>EcO Connections</span>
            {pendingIncomingProposals.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#73E3B4] animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Receivables */}
        <div className="bg-[#1A1C20] border border-[#3D4943]/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#BCCAC1]">
              They Owe You (Receivable)
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#73E3B4]/10 border border-[#73E3B4]/30 flex items-center justify-center text-[#73E3B4]">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-mono font-bold text-[#73E3B4] tabular-nums">
              {formatTaka(totalReceivable)}
            </div>
            <div className="text-[11px] text-[#87948C] mt-0.5">
              Across {people.filter((p) => (personBalances.get(p.id) || 0) > 0).length} debtors
            </div>
          </div>
        </div>

        {/* Payables */}
        <div className="bg-[#1A1C20] border border-[#3D4943]/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#BCCAC1]">
              You Owe (Payable)
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FFB4AB]/10 border border-[#FFB4AB]/30 flex items-center justify-center text-[#FFB4AB]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-mono font-bold text-[#FFB4AB] tabular-nums">
              {formatTaka(totalPayable)}
            </div>
            <div className="text-[11px] text-[#87948C] mt-0.5">
              Across {people.filter((p) => (personBalances.get(p.id) || 0) < 0).length} creditors
            </div>
          </div>
        </div>

        {/* Net Personal Debt Position */}
        <div className="bg-[#1A1C20] border border-[#3D4943]/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#BCCAC1]">
              Net Balance
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 flex items-center justify-center text-[#BCCAC1]">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-xl font-mono font-bold tabular-nums ${
                netPeerPosition > 0
                  ? 'text-[#73E3B4]'
                  : netPeerPosition < 0
                  ? 'text-[#FFB4AB]'
                  : 'text-[#87948C]'
              }`}
            >
              {formatTaka(Math.abs(netPeerPosition))}
            </div>
            <div className="text-[11px] text-[#87948C] mt-0.5">
              {netPeerPosition > 0
                ? 'Net positive (net receivable)'
                : netPeerPosition < 0
                ? 'Net liability (net payable)'
                : 'Fully balanced'}
            </div>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: LOCAL PEOPLE LEDGERS ================= */}
      {activeTab === 'local' && (
        <div className="space-y-4">
          {/* Controls: Search, Filter pills, and Add Person */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search bar */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#87948C]" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#1A1C20] border border-[#3D4943]/40 text-xs text-[#E2E2E8] placeholder-[#87948C] outline-none focus:border-[#73E3B4]/60"
                />
              </div>

              {/* Status filter pills */}
              <div className="flex items-center gap-1 bg-[#1A1C20] p-1 rounded-lg border border-[#3D4943]/40 text-[11px]">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'receivable', label: 'Owes You' },
                    { id: 'payable', label: 'You Owe' },
                    { id: 'settled', label: 'Settled' }
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFilterType(t.id)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filterType === t.id
                        ? 'bg-[#0C0E12] text-[#73E3B4]'
                        : 'text-[#87948C] hover:text-[#E2E2E8]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPersonModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] text-xs font-semibold text-[#003826] flex items-center justify-center gap-1.5 transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Person</span>
            </button>
          </div>

          {/* People List */}
          <div className="bg-[#1A1C20] border border-[#3D4943]/40 rounded-xl overflow-hidden divide-y divide-[#3D4943]/20">
            {filteredPeople.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#87948C] space-y-2">
                <Users2 className="w-8 h-8 text-[#3D4943] mx-auto" />
                <p>
                  {people.length === 0
                    ? 'No people in ledger yet. Tap "Add Person" or record a Give/Take transaction.'
                    : 'No matching people found for this filter.'}
                </p>
              </div>
            ) : (
              filteredPeople.map((p) => {
                const balance = personBalances.get(p.id) || 0;
                const theyOweUser = balance > 0;
                const userOwesThem = balance < 0;

                return (
                  <div
                    key={p.id}
                    className="p-4 flex items-center justify-between hover:bg-[#1E2024]/60 transition-colors group"
                  >
                    {/* Person Avatar & Name */}
                    <div
                      onClick={() => setSelectedPerson(p)}
                      className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#0C0E12] border border-[#3D4943]/50 flex items-center justify-center text-[#BCCAC1] font-semibold text-sm shrink-0 group-hover:border-[#73E3B4]/50 transition-colors">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#E2E2E8] group-hover:text-[#73E3B4] transition-colors truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[#87948C] mt-0.5 truncate">
                          {p.phone ? p.phone : 'Local contact (no phone)'}
                        </div>
                      </div>
                    </div>

                    {/* Balance Status & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right cursor-pointer" onClick={() => setSelectedPerson(p)}>
                        <div
                          className={`text-xs font-mono font-bold tabular-nums ${
                            theyOweUser
                              ? 'text-[#73E3B4]'
                              : userOwesThem
                              ? 'text-[#FFB4AB]'
                              : 'text-[#87948C]'
                          }`}
                        >
                          {formatTaka(Math.abs(balance))}
                        </div>
                        <div className="text-[10px] text-[#87948C] mt-0.5">
                          {theyOweUser ? (
                            <span className="text-[#73E3B4]">Owes you</span>
                          ) : userOwesThem ? (
                            <span className="text-[#FFB4AB]">You owe</span>
                          ) : (
                            'Settled'
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Edit person profile button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditPerson(p)}
                          className="p-2 rounded-lg bg-[#0C0E12] hover:bg-[#1E2024] text-[#87948C] hover:text-[#73E3B4] border border-[#3D4943]/40 transition-colors"
                          title="Edit person details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp reminder button if they owe money */}
                        {theyOweUser && (
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsAppReminder(p)}
                            className="p-2 rounded-lg bg-[#0C0E12] hover:bg-[#1E2024] text-[#73E3B4] border border-[#3D4943]/40 transition-colors"
                            title="Send polite WhatsApp money reminder"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Share link button */}
                        <button
                          type="button"
                          onClick={() => handleOpenShareModal(p)}
                          className="p-2 rounded-lg bg-[#0C0E12] hover:bg-[#1E2024] text-[#87948C] hover:text-[#E2E2E8] border border-[#3D4943]/40 transition-colors"
                          title="Generate private read-only share link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Open Ledger Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedPerson(p)}
                          className="p-2 rounded-lg bg-[#0C0E12] hover:bg-[#1E2024] text-[#87948C] hover:text-[#E2E2E8] border border-[#3D4943]/40 transition-colors"
                          title="Open personal ledger"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: ECO-TO-ECO CONNECTIONS ================= */}
      {activeTab === 'connections' && (
        <div className="space-y-6">
          {/* Identity Card: My EcO Connection Code */}
          <div className="bg-[#1A1C20] border border-[#3D4943]/40 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#BCCAC1]">
                My EcO Connection Code
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-[#73E3B4] tracking-wider">
                  {myConnectionCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyMyCode}
                  className="px-2.5 py-1 rounded-md bg-[#0C0E12] hover:bg-[#1E2024] text-[#E2E2E8] text-[11px] border border-[#3D4943]/40 flex items-center gap-1 transition-colors"
                >
                  {copiedMyCode ? <Check className="w-3 h-3 text-[#73E3B4]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMyCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#87948C]">
                Share this code with another EcO user to connect and propose shared transactions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] text-[#003826] font-semibold text-xs flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
            >
              <Link2 className="w-4 h-4" />
              <span>Connect with User</span>
            </button>
          </div>

          {/* Pending Proposals Section */}
          {pendingIncomingProposals.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#73E3B4] flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Pending Transaction Proposals ({pendingIncomingProposals.length})</span>
              </h3>

              <div className="space-y-2">
                {pendingIncomingProposals.map((proposal) => {
                  const isRecipientReceiving = proposal.originalSenderType === 'give';

                  return (
                    <div
                      key={proposal.id}
                      className="bg-[#1A1C20] border border-[#73E3B4]/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#E2E2E8]">
                          <span>{proposal.senderName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#0C0E12] text-[#BCCAC1] border border-[#3D4943]/40">
                            {formatDisplayDate(proposal.date)}
                          </span>
                        </div>
                        <div className="text-xs text-[#BCCAC1]">
                          {isRecipientReceiving ? (
                            <span>
                              Lent you <strong className="font-mono text-[#73E3B4]">{formatTaka(proposal.amount)}</strong> (You will owe {proposal.senderName})
                            </span>
                          ) : (
                            <span>
                              Borrowed <strong className="font-mono text-[#FFB4AB]">{formatTaka(proposal.amount)}</strong> from you
                            </span>
                          )}
                        </div>
                        {proposal.note && (
                          <div className="text-[11px] text-[#87948C] italic">"{proposal.note}"</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onRejectProposal?.(proposal.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#282A2E] hover:bg-[#FFB4AB]/20 text-[#FFB4AB] text-xs font-medium transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setAcceptingProposal(proposal)}
                          className="px-4 py-1.5 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] text-[#003826] font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Record</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Connected Peers List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#BCCAC1]">
              Connected EcO Peers ({connections.length})
            </h3>

            <div className="bg-[#1A1C20] border border-[#3D4943]/40 rounded-xl overflow-hidden divide-y divide-[#3D4943]/20">
              {connections.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#87948C]">
                  No connected EcO users yet. Tap "Connect with User" to invite a friend using their code.
                </div>
              ) : (
                connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-4 flex items-center justify-between hover:bg-[#1E2024]/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0C0E12] border border-[#73E3B4]/40 flex items-center justify-center text-[#73E3B4]">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#E2E2E8]">{conn.peerName}</div>
                        <div className="text-[10px] font-mono text-[#87948C]">{conn.peerCode}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenProposeForPeer(conn)}
                        className="px-3 py-1.5 rounded-lg bg-[#0C0E12] hover:bg-[#1E2024] text-[#73E3B4] border border-[#3D4943]/40 text-xs font-medium flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" />
                        <span>Propose Transaction</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteConnection?.(conn.id)}
                        className="p-1.5 rounded-lg text-[#87948C] hover:text-[#FFB4AB] hover:bg-[#282A2E] transition-colors"
                        title="Disconnect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Connect With User Modal --- */}
      {showConnectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConnectModal(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#1A1C20] border border-[#3D4943]/60 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3D4943]/30 pb-3">
              <h3 className="text-sm font-semibold text-[#E2E2E8] flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#73E3B4]" />
                <span>Connect with an EcO User</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {connectError && (
              <div className="p-2.5 rounded-lg bg-[#FFB4AB]/10 border border-[#FFB4AB]/30 text-[#FFB4AB] text-xs">
                {connectError}
              </div>
            )}

            <form onSubmit={handleSendConnectionRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] uppercase tracking-wider mb-1">
                  User's EcO Connection Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. ECO-4821"
                  value={connectCodeInput}
                  onChange={(e) => setConnectCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 font-mono text-[#E2E2E8] outline-none focus:border-[#73E3B4]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] uppercase tracking-wider mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emon Ahmed"
                  value={connectNameInput}
                  onChange={(e) => setConnectNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-[#E2E2E8] outline-none focus:border-[#73E3B4]"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#0C0E12] border border-[#3D4943]/30 text-[11px] text-[#87948C] leading-relaxed">
                EcO establishes a direct connection. You can propose shared transactions to each other, but your private financial details and account balances remain strictly private.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#282A2E] text-xs text-[#BCCAC1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] text-[#003826] font-semibold text-xs transition-colors"
                >
                  Connect User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Propose Shared Transaction Modal --- */}
      {showProposeModal && proposalPeer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProposeModal(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#1A1C20] border border-[#3D4943]/60 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3D4943]/30 pb-3">
              <h3 className="text-sm font-semibold text-[#E2E2E8] flex items-center gap-2">
                <Send className="w-4 h-4 text-[#73E3B4]" />
                <span>Propose Transaction to {proposalPeer.peerName}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowProposeModal(false)}
                className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {proposalError && (
              <div className="p-2.5 rounded-lg bg-[#FFB4AB]/10 border border-[#FFB4AB]/30 text-[#FFB4AB] text-xs">
                {proposalError}
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] uppercase tracking-wider mb-1">
                  Direction (From Your Perspective)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProposalType('give')}
                    className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                      proposalType === 'give'
                        ? 'bg-[#1E2024] border-[#73E3B4] text-[#73E3B4]'
                        : 'bg-[#0C0E12] border-[#3D4943]/40 text-[#87948C]'
                    }`}
                  >
                    I Lent / Gave Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setProposalType('take')}
                    className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                      proposalType === 'take'
                        ? 'bg-[#1E2024] border-[#FFB4AB] text-[#FFB4AB]'
                        : 'bg-[#0C0E12] border-[#3D4943]/40 text-[#87948C]'
                    }`}
                  >
                    I Received / Borrowed
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] uppercase tracking-wider mb-1">
                  Amount (৳)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={proposalAmountStr}
                  onChange={(e) => setProposalAmountStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 font-mono text-base text-[#E2E2E8] outline-none focus:border-[#73E3B4]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] uppercase tracking-wider mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={proposalDate}
                  onChange={(e) => setProposalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] uppercase tracking-wider mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lunch split, ticket reimbursement..."
                  value={proposalNote}
                  onChange={(e) => setProposalNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] outline-none focus:border-[#73E3B4]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#282A2E] text-xs text-[#BCCAC1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] text-[#003826] font-semibold text-xs"
                >
                  Send Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Accept Proposal: Select Wallet Modal --- */}
      {acceptingProposal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAcceptingProposal(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#1A1C20] border border-[#3D4943]/60 rounded-xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#3D4943]/30 pb-3">
              <h3 className="text-sm font-semibold text-[#E2E2E8] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#73E3B4]" />
                <span>Confirm & Post Transaction</span>
              </h3>
              <button
                type="button"
                onClick={() => setAcceptingProposal(null)}
                className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#0C0E12] border border-[#3D4943]/30 space-y-1">
              <div className="text-[11px] text-[#87948C]">Transaction from {acceptingProposal.senderName}:</div>
              <div className="text-sm font-semibold text-[#E2E2E8]">
                {acceptingProposal.originalSenderType === 'give' ? 'They lent you' : 'They borrowed from you'}:{' '}
                <span className="font-mono text-[#73E3B4]">{formatTaka(acceptingProposal.amount)}</span>
              </div>
              <div className="text-[10px] text-[#87948C]">
                Your ledger will record a {invertProposalDirection(acceptingProposal.originalSenderType).toUpperCase()} entry on {formatDisplayDate(acceptingProposal.date)}.
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#BCCAC1] uppercase tracking-wider mb-1.5">
                Which payment method / wallet is affected?
              </label>
              <select
                value={selectedWalletForAccept}
                onChange={(e) => setSelectedWalletForAccept(e.target.value)}
                className="w-full bg-[#0C0E12] border border-[#3D4943]/50 rounded-lg px-3 py-2 text-xs text-[#E2E2E8] outline-none focus:border-[#73E3B4]"
              >
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({formatTaka(m.balance || 0)})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAcceptingProposal(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#282A2E] text-xs text-[#BCCAC1]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAcceptProposal}
                className="px-4 py-1.5 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] text-[#003826] font-semibold text-xs"
              >
                Confirm & Add to Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Personal Ledger History Modal / Drawer --- */}
      {selectedPerson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPerson(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[#1A1C20] border border-[#3D4943]/60 rounded-xl p-5 shadow-2xl flex flex-col max-h-[85vh] space-y-4">
            <div className="flex items-center justify-between border-b border-[#3D4943]/30 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0C0E12] border border-[#3D4943]/50 flex items-center justify-center text-[#BCCAC1] font-semibold text-sm">
                  {selectedPerson.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#E2E2E8]">
                    {selectedPerson.name}
                  </h3>
                  <div className="text-[11px] text-[#BCCAC1]">
                    Net balance:{' '}
                    <span
                      className={`font-mono font-bold ${
                        (personBalances.get(selectedPerson.id) || 0) > 0
                          ? 'text-[#73E3B4]'
                          : (personBalances.get(selectedPerson.id) || 0) < 0
                          ? 'text-[#FFB4AB]'
                          : 'text-[#87948C]'
                      }`}
                    >
                      {formatTaka(personBalances.get(selectedPerson.id) || 0)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEditPerson(selectedPerson)}
                  className="p-1.5 rounded-lg bg-[#0C0E12] hover:bg-[#1E2024] text-[#87948C] hover:text-[#73E3B4] border border-[#3D4943]/40 transition-colors"
                  title="Edit person profile"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPerson(null)}
                  aria-label="Close ledger"
                  className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenAddPeerTransaction(selectedPerson.id);
                  setSelectedPerson(null);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] text-[#003826] font-semibold text-xs text-center transition-colors shadow-sm"
              >
                + Record Give / Take
              </button>
              {(personBalances.get(selectedPerson.id) || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenWhatsAppReminder(selectedPerson);
                  }}
                  className="py-2 px-3 rounded-lg bg-[#0C0E12] hover:bg-[#1E2024] text-[#73E3B4] border border-[#3D4943]/40 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Reminder</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleOpenShareModal(selectedPerson);
                }}
                className="py-2 px-3 rounded-lg bg-[#0C0E12] hover:bg-[#1E2024] text-[#87948C] hover:text-[#E2E2E8] border border-[#3D4943]/40 text-xs flex items-center gap-1.5 transition-colors"
                title="Share ledger link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>

            {/* Transaction log */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#3D4943]/20 pr-1">
              {personTransactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#87948C]">
                  No Give/Take transactions recorded with {selectedPerson.name} yet.
                </div>
              ) : (
                personTransactions.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[#E2E2E8] font-medium flex items-center gap-1.5">
                        {tx.type === 'give' ? (
                          <span className="text-[#73E3B4]">I Lent / Gave</span>
                        ) : (
                          <span className="text-[#FFB4AB]">I Received / Borrowed</span>
                        )}
                        {tx.tag && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0C0E12] text-[#87948C] border border-[#3D4943]/30">
                            {tx.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#87948C] mt-0.5">
                        {formatDisplayDate(tx.date)} {tx.description ? `· ${tx.description}` : ''}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold tabular-nums text-[#E2E2E8]">
                      {formatTaka(tx.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- WhatsApp Reminder Modal --- */}
      {whatsappPerson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setWhatsappPerson(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#1A1C20] border border-[#3D4943]/60 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3D4943]/30 pb-3">
              <h4 className="text-sm font-semibold text-[#E2E2E8] flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#73E3B4]" />
                <span>WhatsApp Debt Reminder</span>
              </h4>
              <button
                type="button"
                onClick={() => setWhatsappPerson(null)}
                aria-label="Close reminder"
                className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {whatsappError && (
              <div className="p-2.5 rounded-lg bg-[#FFB4AB]/10 border border-[#FFB4AB]/30 text-[#FFB4AB] text-xs">
                {whatsappError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[#0C0E12] border border-[#3D4943]/30 text-[11px] text-[#BCCAC1]">
                EcO generates a culturally polite Bangla reminder message. Review the message and phone number before opening WhatsApp.
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] mb-1">
                  Recipient Phone / WhatsApp Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +8801712345678"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs font-mono text-[#E2E2E8] outline-none focus:border-[#73E3B4]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] mb-1">
                  Message Content (Bangla Template)
                </label>
                <textarea
                  rows={6}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] leading-relaxed resize-none outline-none focus:border-[#73E3B4]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#3D4943]/30">
              <button
                type="button"
                onClick={() => setWhatsappPerson(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#87948C] hover:text-[#E2E2E8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCopyAndLaunchWhatsApp}
                className="px-4 py-2 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] text-[#003826] font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {copiedReminder ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied & Opening...</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy & Open WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Share Link Modal --- */}
      {shareLinkPerson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShareLinkPerson(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#1A1C20] border border-[#3D4943]/60 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3D4943]/30 pb-3">
              <h4 className="text-sm font-semibold text-[#E2E2E8] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#73E3B4]" />
                <span>Read-Only Statement Share</span>
              </h4>
              <button
                type="button"
                onClick={() => setShareLinkPerson(null)}
                className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#BCCAC1] text-xs leading-relaxed">
                This link allows <strong>{shareLinkPerson.name}</strong> to view only their transaction history with you. None of your personal wallets, bank accounts, or other personal ledgers are revealed.
              </p>

              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] mb-1">
                  Shareable Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedShareUrl}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs font-mono text-[#E2E2E8] select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedShareUrl);
                      setCopiedShareUrl(true);
                      setTimeout(() => setCopiedShareUrl(false), 2000);
                    }}
                    className="px-3 py-2 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] text-[#003826] font-semibold text-xs flex items-center gap-1 shadow-sm shrink-0"
                  >
                    {copiedShareUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedShareUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-[#3D4943]/30">
              <button
                type="button"
                onClick={() => setShareLinkPerson(null)}
                className="px-4 py-1.5 rounded-lg bg-[#282A2E] text-xs text-[#E2E2E8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Add Person Modal --- */}
      {showAddPersonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddPersonModal(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-[#1A1C20] border border-[#3D4943]/60 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3D4943]/30 pb-3">
              <h4 className="text-sm font-semibold text-[#E2E2E8]">Add Person to Ledger</h4>
              <button
                type="button"
                onClick={() => {
                  setAddPersonError(null);
                  setShowAddPersonModal(false);
                }}
                className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addPersonError && (
              <div className="p-2.5 rounded-lg bg-[#FFB4AB]/10 border border-[#FFB4AB]/30 text-[#FFB4AB] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addPersonError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] mb-1">
                  Full Name <span className="text-[#FFB4AB]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emon Ahmed"
                  value={newPersonName}
                  onChange={(e) => {
                    setNewPersonName(e.target.value);
                    if (addPersonError) setAddPersonError(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] outline-none focus:border-[#73E3B4]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] mb-1">
                  Phone Number (Optional for WhatsApp reminders)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 017XXXXXXXX or +88017XXXXXXXX"
                  value={newPersonPhone}
                  onChange={(e) => setNewPersonPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] outline-none focus:border-[#73E3B4]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#3D4943]/30">
              <button
                type="button"
                onClick={() => {
                  setAddPersonError(null);
                  setShowAddPersonModal(false);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs text-[#87948C] hover:text-[#E2E2E8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePerson}
                disabled={!newPersonName.trim()}
                className="px-4 py-1.5 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] disabled:opacity-50 text-[#003826] font-semibold text-xs transition-colors"
              >
                Add Person
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Person Modal --- */}
      {editingPerson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingEdit) setEditingPerson(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-[#1A1C20] border border-[#3D4943]/60 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3D4943]/30 pb-3">
              <h4 className="text-sm font-semibold text-[#E2E2E8] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#73E3B4]" />
                <span>Edit Person Details</span>
              </h4>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setEditingPerson(null)}
                className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 rounded-lg bg-[#FFB4AB]/10 border border-[#FFB4AB]/30 text-[#FFB4AB] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="p-2.5 rounded-lg bg-[#73E3B4]/10 border border-[#73E3B4]/30 text-[#73E3B4] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditPerson} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] mb-1">
                  Full Name <span className="text-[#FFB4AB]">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editError) setEditError(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] outline-none focus:border-[#73E3B4]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#BCCAC1] mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 017XXXXXXXX or +88017XXXXXXXX"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C0E12] border border-[#3D4943]/50 text-xs text-[#E2E2E8] outline-none focus:border-[#73E3B4]"
                />
                <p className="text-[10px] text-[#87948C] mt-1">
                  Used for one-click WhatsApp payment reminders with automatic Bangladeshi country code (+880).
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#3D4943]/30">
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingPerson(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-[#87948C] hover:text-[#E2E2E8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim() || isSavingEdit}
                  className="px-4 py-1.5 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] disabled:opacity-50 text-[#003826] font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  {isSavingEdit ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
