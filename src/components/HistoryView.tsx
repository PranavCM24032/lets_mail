import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Download,
  Trash2,
  Eye,
  Calendar,
  Send,
  ArrowRight
} from 'lucide-react';
import { Campaign, RecipientDeliveryLog } from '../types';

interface HistoryViewProps {
  campaigns: Campaign[];
  onDeleteCampaign: (id: string) => void;
  onNavigateToComposer: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  campaigns,
  onDeleteCampaign,
  onNavigateToComposer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const filteredCampaigns = campaigns.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q);
  });

  const handleExportCsv = (camp: Campaign) => {
    const headers = ['Recipient_Email', 'Recipient_Name', 'Status', 'Timestamp', 'Message_ID', 'Error_Reason'];
    const rows = (camp.deliveryLogs || []).map((log) => [
      log.email,
      `"${(log.name || '').replace(/"/g, '""')}"`,
      log.status,
      log.timestamp || '',
      log.messageId || '',
      `"${(log.error || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${camp.name.replace(/\s+/g, '_')}_delivery_logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Campaign History &amp; Delivery Logs</h2>
          <p className="text-slate-400 text-xs mt-1">
            Audit individual recipient delivery records, timestamps, message IDs, and failure reasons.
          </p>
        </div>

        <button
          onClick={onNavigateToComposer}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/25 transition self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Campaigns List Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Total Campaigns: {campaigns.length}
          </span>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <History className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No past campaign records match your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{camp.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        camp.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {camp.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-slate-400 truncate max-w-lg">
                    Subject: <span className="text-slate-200">{camp.subject}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 text-[11px] pt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {new Date(camp.createdAt).toLocaleString()}
                    </span>
                    <span>&bull;</span>
                    <span className="text-emerald-400 font-semibold">{camp.sentCount} sent</span>
                    <span>&bull;</span>
                    <span className="text-rose-400">{camp.failedCount} errors</span>
                    <span>&bull;</span>
                    <span>{camp.totalCount} total in batch</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => setSelectedCampaign(camp)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    Inspect Logs ({camp.deliveryLogs?.length || 0})
                  </button>

                  <button
                    onClick={() => handleExportCsv(camp)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
                    title="Export logs to CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteCampaign(camp.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100 text-xs">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedCampaign.name}</h3>
                <p className="text-slate-400 text-xs font-mono">ID: {selectedCampaign.id}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCsv(selectedCampaign)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-xs space-y-1">
                <p><span className="text-slate-400">Subject:</span> <strong className="text-white">{selectedCampaign.subject}</strong></p>
                <p><span className="text-slate-400">Sent:</span> <strong className="text-emerald-400">{selectedCampaign.sentCount}</strong> &bull; <span className="text-slate-400">Failed:</span> <strong className="text-rose-400">{selectedCampaign.failedCount}</strong></p>
              </div>

              <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                Per-Recipient Delivery Ticker
              </h4>

              <div className="border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Recipient</th>
                      <th className="px-3 py-2.5">Timestamp</th>
                      <th className="px-3 py-2.5">Message ID / Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                    {(selectedCampaign.deliveryLogs || []).map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/50">
                        <td className="px-3 py-2 font-sans">
                          {log.status === 'success' ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1 font-semibold">
                              <XCircle className="w-3.5 h-3.5" /> {log.status}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-white font-medium truncate max-w-xs">
                          {log.email} {log.name && <span className="text-slate-500 font-sans">({log.name})</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '-'}</td>
                        <td className="px-3 py-2 text-slate-400 truncate max-w-xs">
                          {log.messageId ? <span className="text-blue-400">{log.messageId}</span> : <span className="text-rose-400">{log.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
