import React from 'react';
import { X, CheckCheck, Clock, ShieldAlert } from 'lucide-react';
import { AppNotification } from '../domain/types';
import { formatDisplayDate } from '../domain/dates';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-[#1A1C20] border border-[#3D4943]/60 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3D4943]/40 bg-[#1E2024]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#E2E2E8]">Notification Inbox</h3>
            <span className="text-[10px] text-[#BCCAC1] px-1.5 py-0.5 rounded bg-[#282A2E]">
              7-Day Retention
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#87948C] hover:text-[#E2E2E8] hover:bg-[#282A2E] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info banner */}
        <div className="px-4 py-2 bg-[#0C0E12] border-b border-[#3D4943]/30 text-[11px] text-[#87948C] flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#BCCAC1] shrink-0" />
          <span>Notifications automatically delete after 7 days to preserve privacy.</span>
        </div>

        {/* List content */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#3D4943]/20 p-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-[#87948C] text-xs">
              No recent notifications in the past 7 days.
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = !notif.readAt;
              const dateStr = new Date(notif.createdAt).toISOString().split('T')[0];
              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkRead(notif.id)}
                  className={`p-3 rounded text-left transition-colors cursor-pointer ${
                    isUnread ? 'bg-[#1E2024]/80 hover:bg-[#282A2E]' : 'hover:bg-[#1E2024]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-[#E2E2E8]">
                      {notif.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#87948C] shrink-0">
                      {formatDisplayDate(dateStr)}
                    </span>
                  </div>
                  <p className="text-xs text-[#BCCAC1] mt-1 leading-relaxed">
                    {notif.body}
                  </p>
                  {isUnread && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#73E3B4]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#73E3B4]" />
                      <span>Unread</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
