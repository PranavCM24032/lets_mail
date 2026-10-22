import React from 'react';
import { AlertTriangle, Send, X, ShieldCheck } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  senderEmail: string;
  recipientCount: number;
  subjectPreview: string;
  quotaRemaining: number;
  quotaLimit?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isSending?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  senderEmail,
  recipientCount,
  subjectPreview,
  quotaRemaining,
  quotaLimit = 500,
  onConfirm,
  onCancel,
  isSending = false
}) => {
  if (!isOpen) return null;

  const isExceedingQuota = recipientCount > quotaRemaining;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full shadow-xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500">Confirm bulk email transmission</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSending}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Sender Account:</span>
              <span className="font-mono text-slate-900 font-medium truncate max-w-[240px]">
                {senderEmail}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Recipients to Send:</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {recipientCount} {recipientCount === 1 ? 'student' : 'students'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Subject Preview:</span>
              <span className="font-medium text-slate-800 truncate max-w-[240px]">
                {subjectPreview || '(No subject)'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Daily Allowance Left:</span>
              <span className="font-semibold text-emerald-700 tabular-nums">
                {quotaRemaining} / {quotaLimit}
              </span>
            </div>
          </div>

          {isExceedingQuota ? (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                You have <strong>{recipientCount}</strong> recipients, but only{' '}
                <strong>{quotaRemaining}</strong> remaining today under Google's daily limit.
                The sender will dispatch {quotaRemaining} and safely pause remaining messages.
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-indigo-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Messages will be sent individually from your authorized Gmail address directly to student inboxes.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
          <button
            onClick={onCancel}
            disabled={isSending}
            className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSending}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {isSending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Campaign</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
