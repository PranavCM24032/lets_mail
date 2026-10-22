import React, { useState } from 'react';
import { CheckCircle2, XCircle, Pause, Play, Square, ArrowRight } from 'lucide-react';
import { RecipientDeliveryLog } from '../types';

interface BulkSendingModalProps {
  isOpen: boolean;
  campaignName: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  currentIndex: number;
  currentEmail?: string;
  logs: RecipientDeliveryLog[];
  isCompleted: boolean;
  isPaused: boolean;
  isCancelled: boolean;
  onPauseToggle: () => void;
  onCancel: () => void;
  onClose: () => void;
  onViewHistory: () => void;
}

export const BulkSendingModal: React.FC<BulkSendingModalProps> = ({
  isOpen,
  campaignName,
  totalRecipients,
  sentCount,
  failedCount,
  currentIndex,
  currentEmail,
  logs,
  isCompleted,
  isPaused,
  isCancelled,
  onPauseToggle,
  onCancel,
  onClose,
  onViewHistory
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'success' | 'failed'>('all');

  if (!isOpen) return null;

  const progressPercent = totalRecipients > 0 ? Math.round((currentIndex / totalRecipients) * 100) : 0;
  const filteredLogs = logs.filter((log) => {
    if (filterMode === 'success') return log.status === 'success';
    if (filterMode === 'failed') return log.status === 'failed' || log.status === 'skipped';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-800 text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 truncate max-w-sm">{campaignName}</span>
              {isCompleted ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                  Completed
                </span>
              ) : isCancelled ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700">
                  Cancelled
                </span>
              ) : isPaused ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                  Paused
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">
                  Transmitting
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {currentIndex} of {totalRecipients} processed ({progressPercent}%)
            </p>
          </div>

          {!isCompleted && !isCancelled && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onPauseToggle}
                className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1 transition"
              >
                {isPaused ? <Play className="w-3 h-3 text-emerald-600" /> : <Pause className="w-3 h-3 text-amber-600" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={onCancel}
                className="px-2.5 py-1 rounded-md border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium text-xs flex items-center gap-1 transition"
              >
                <Square className="w-3 h-3 text-rose-600" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">Dispatch Progress</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-600' : isPaused ? 'bg-amber-500' : isCancelled ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <p className="text-[10px] text-slate-500">In Batch</p>
              <p className="text-base font-bold text-slate-900 tabular-nums">{totalRecipients}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <p className="text-[10px] text-emerald-700">Delivered</p>
              <p className="text-base font-bold text-emerald-700 tabular-nums">{sentCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100">
              <p className="text-[10px] text-rose-700">Errors</p>
              <p className="text-base font-bold text-rose-700 tabular-nums">{failedCount}</p>
            </div>
          </div>

          {!isCompleted && !isCancelled && currentEmail && (
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 truncate">
                Sending to: <strong className="text-slate-900 font-mono">{currentEmail}</strong>
              </span>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">~650ms rate throttle</span>
            </div>
          )}
        </div>

        {/* Live Delivery Feed */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900">
              Delivery Feed ({logs.length})
            </span>
            <div className="flex gap-1 text-[11px]">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded ${filterMode === 'all' ? 'bg-slate-200 text-slate-900 font-medium' : 'text-slate-500'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('success')}
                className={`px-2 py-0.5 rounded ${filterMode === 'success' ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-slate-500'}`}
              >
                Sent ({sentCount})
              </button>
              <button
                onClick={() => setFilterMode('failed')}
                className={`px-2 py-0.5 rounded ${filterMode === 'failed' ? 'bg-rose-100 text-rose-800 font-medium' : 'text-slate-500'}`}
              >
                Errors ({failedCount})
              </button>
            </div>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Connecting to mail server...</p>
            ) : (
              filteredLogs.slice().reverse().map((log, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="font-mono text-slate-900 truncate">{log.email}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {log.status === 'success' ? 'Dispatched' : (log.error || 'Failed')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-[11px] text-slate-400">
            {isCompleted ? 'Transmission finished.' : 'Keep this browser tab open until complete.'}
          </p>

          <div className="flex items-center gap-2">
            {(isCompleted || isCancelled) && (
              <button
                onClick={onViewHistory}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 font-medium text-xs flex items-center gap-1 transition"
              >
                <span>View Campaign</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              disabled={!isCompleted && !isCancelled && !isPaused}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition disabled:opacity-50"
            >
              {isCompleted || isCancelled ? 'Close' : 'Minimize'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
