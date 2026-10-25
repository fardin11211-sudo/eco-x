import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  MessageSquareHeart,
  Bug,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Info,
  Camera
} from 'lucide-react';
import { IssueReport, IssueReportType } from '../domain/types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  userEmail?: string;
  onSubmitReport: (report: IssueReport) => void;
  showToast: (msg: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  userEmail,
  onSubmitReport,
  showToast
}) => {
  // Persistent draft state across modal toggles
  const [reportType, setReportType] = useState<IssueReportType>('bug');
  const [selectedSection, setSelectedSection] = useState<string>(currentPage || 'Home');
  const [message, setMessage] = useState<string>('');
  const [contactPermission, setContactPermission] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  // Sync selectedSection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSection(currentPage || 'Home');
      setValidationError(null);
      setShowDiscardConfirm(false);
    }
  }, [isOpen, currentPage]);

  // Global Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleAttemptClose();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, message]);

  const handleAttemptClose = () => {
    if (message.trim().length > 0) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setMessage('');
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleKeepDraftAndClose = () => {
    // Preserve draft text in state for next time
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setValidationError('অনুগ্রহ করে অন্তত ১০ অক্ষরের বার্তা লিখুন (Please enter at least 10 meaningful characters).');
      return;
    }

    if (trimmed.length > 2000) {
      setValidationError('বার্তা ২০০০ অক্ষরের বেশি হতে পারবে না (Message cannot exceed 2000 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const newReport: IssueReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: 'local_user',
        userEmail: userEmail || undefined,
        type: reportType,
        message: trimmed,
        page: selectedSection,
        deviceContext: {
          browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
          theme: 'dark',
          version: 'v2.0'
        },
        contactPermission,
        status: 'new',
        createdAt: Date.now()
      };

      onSubmitReport(newReport);
      setMessage('');
      setIsSubmitting(false);
      onClose();
      showToast('ধন্যবাদ! আপনার মতামত আমরা পেয়েছি।');
    } catch (err: any) {
      setIsSubmitting(false);
      setValidationError(err.message || 'মতামত পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  if (!isOpen) return null;

  const charCount = message.length;
  const isTooShort = message.trim().length > 0 && message.trim().length < 10;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleAttemptClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-[#1A1C20] border border-[#3D4943]/60 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3D4943]/40 bg-[#1E2024]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0C0E12] border border-[#73E3B4]/40 flex items-center justify-center text-[#73E3B4]">
              <MessageSquareHeart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#E2E2E8] tracking-tight">
                অ্যাপ রে গালাবো
              </h2>
              <p className="text-[11px] text-[#BCCAC1]">
                অভিযোগ, পরামর্শ, বাগ রিপোর্ট বা অনুভূতি জানান
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-1.5 rounded-lg text-[#87948C] hover:text-[#E2E2E8] hover:bg-[#282A2E] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unsaved draft confirmation prompt */}
        {showDiscardConfirm ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#282A2E] text-[#FFB4AB] flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#E2E2E8]">খসড়া বার্তাটি কী করবেন?</h3>
              <p className="text-xs text-[#BCCAC1] mt-1">
                আপনার একটি অসম্পূর্ণ বার্তা রয়েছে। আপনি কি এটি সংরক্ষণ রাখতে চান নাকি মুছে ফেলতে চান?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-4 py-2 rounded bg-[#282A2E] hover:bg-[#FFB4AB]/20 text-[#FFB4AB] text-xs font-medium transition-colors"
              >
                মুছে ফেলুন (Discard)
              </button>
              <button
                type="button"
                onClick={handleKeepDraftAndClose}
                className="px-4 py-2 rounded bg-[#55C79A] hover:bg-[#73E3B4] text-[#003826] text-xs font-semibold transition-colors"
              >
                ড্রাফট রেখে বন্ধ করুন (Keep Draft)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Validation Error banner */}
            {validationError && (
              <div className="p-3 rounded-lg bg-[#FFB4AB]/10 border border-[#FFB4AB]/30 text-[#FFB4AB] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Type Selector */}
            <div>
              <label className="block text-[11px] font-medium text-[#BCCAC1] uppercase tracking-wider mb-2">
                বার্তার ধরন (Message Type)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'bug' as IssueReportType, labelBn: 'বাগ / সমস্যা', labelEn: 'Bug', icon: Bug },
                  { id: 'idea' as IssueReportType, labelBn: 'আইডিয়া / পরামর্শ', labelEn: 'Idea', icon: Lightbulb },
                  { id: 'complaint' as IssueReportType, labelBn: 'অভিযোগ', labelEn: 'Complaint', icon: AlertCircle },
                  { id: 'other' as IssueReportType, labelBn: 'অন্যান্য', labelEn: 'Other', icon: HelpCircle }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = reportType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setReportType(item.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#1E2024] border-[#73E3B4] text-[#73E3B4]'
                          : 'bg-[#111317] border-[#3D4943]/40 text-[#BCCAC1] hover:border-[#3D4943]/80'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <div>
                        <div className="font-semibold text-[11px]">{item.labelBn}</div>
                        <div className="text-[10px] text-[#87948C]">{item.labelEn}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* App Section */}
            <div>
              <label className="block text-[11px] font-medium text-[#BCCAC1] uppercase tracking-wider mb-1.5">
                কোন পেজের সাথে সম্পর্কিত? (App Section)
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full bg-[#111317] border border-[#3D4943]/50 rounded-lg px-3 py-2 text-xs text-[#E2E2E8] focus:border-[#73E3B4] outline-none"
              >
                <option value="Home">Home / Dashboard</option>
                <option value="Expenses">Expenses & Ledger History</option>
                <option value="Stats">Financial Statistics</option>
                <option value="Wallet">Active Wallets</option>
                <option value="Transactions">People & Debt Ledger</option>
                <option value="Settings">Settings & Backup</option>
                <option value="Other">অন্যান্য (Other)</option>
              </select>
            </div>

            {/* Message Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-[#BCCAC1] uppercase tracking-wider">
                  আপনার মতামত বা অভিযোগ <span className="text-[#FFB4AB]">*</span>
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    charCount > 2000 ? 'text-[#FFB4AB]' : charCount >= 10 ? 'text-[#73E3B4]' : 'text-[#87948C]'
                  }`}
                >
                  {charCount}/2000
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                rows={4}
                maxLength={2000}
                placeholder="খোলামেলা লিখুন—কোনটা ভালো লেগেছে, কোথায় সমস্যা হচ্ছে বা কী যোগ করা উচিত..."
                className="w-full bg-[#111317] border border-[#3D4943]/50 rounded-lg p-3 text-xs text-[#E2E2E8] placeholder-[#87948C]/60 focus:border-[#73E3B4] outline-none resize-none"
                autoFocus
              />
              {isTooShort && (
                <div className="text-[10px] text-[#FFB4AB] mt-1">
                  কমপক্ষে ১০ অক্ষরের বার্তা দিন ({10 - message.trim().length} অক্ষর বাকি)
                </div>
              )}
            </div>

            {/* Contact Permission */}
            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#111317] border border-[#3D4943]/40 cursor-pointer hover:bg-[#1E2024]/40 transition-colors">
              <input
                type="checkbox"
                checked={contactPermission}
                onChange={(e) => setContactPermission(e.target.checked)}
                className="mt-0.5 rounded border-[#3D4943] text-[#55C79A] focus:ring-0 bg-[#0C0E12]"
              />
              <div className="text-xs">
                <span className="text-[#E2E2E8] font-medium">প্রয়োজনে আমার সাথে যোগাযোগ করতে পারেন</span>
                <p className="text-[10px] text-[#87948C] mt-0.5">
                  {userEmail ? `আপনার অ্যাকাউন্ট ইমেইল: ${userEmail}` : 'আমাদের টিম ফলোআপের জন্য উত্তর পাঠাতে পারবে।'}
                </p>
              </div>
            </label>

            {/* Screenshot attachment notice */}
            <div className="p-3 rounded-lg bg-[#111317] border border-[#3D4943]/30 flex items-center justify-between text-[11px] text-[#87948C]">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#87948C]" />
                <span>স্ক্রিনশট সংযুক্তি (Screenshot)</span>
              </div>
              <span className="text-[10px] bg-[#1E2024] px-2 py-0.5 rounded border border-[#3D4943]/40 text-[#BCCAC1]">
                ক্লাউড স্টোরেজ সেটআপের পর সক্রিয় হবে
              </span>
            </div>

            {/* Privacy & Diagnostic disclosure */}
            <div className="p-3 rounded-lg bg-[#0C0E12] border border-[#3D4943]/30 text-[10px] text-[#87948C] flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-[#73E3B4] shrink-0 mt-0.5" />
              <span>
                আমাদের সমস্যাটি দ্রুত বুঝতে সাহায্য করার জন্য পেজ ({selectedSection}), ডিভাইস টাইপ এবং অ্যাপ সংস্করণ (v2.0) স্বয়ংক্রিয়ভাবে যুক্ত হবে। আপনার পাসওয়ার্ড বা কোনো আর্থিক ব্যালেন্স কখনোই শেয়ার হয় না।
              </span>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleAttemptClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-[#282A2E] hover:bg-[#3D4943]/60 text-[#BCCAC1] hover:text-[#E2E2E8] text-xs transition-colors"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="submit"
                disabled={isSubmitting || message.trim().length < 10}
                className="px-5 py-2 rounded-lg bg-[#55C79A] hover:bg-[#73E3B4] disabled:opacity-50 disabled:cursor-not-allowed text-[#003826] font-semibold text-xs flex items-center gap-2 transition-all shadow-sm"
              >
                {isSubmitting ? (
                  <span>পাঠানো হচ্ছে...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>মতামত পাঠান</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
