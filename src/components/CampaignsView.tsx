import React, { useState } from 'react';
import {
  Mail,
  Search,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Campaign, RecipientDeliveryLog } from '../types';

interface CampaignsViewProps {
  campaigns: Campaign[];
  onDeleteCampaign: (id: string) => void;
  onCreateNew: () => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  onDeleteCampaign,
  onCreateNew
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'draft' | 'cancelled'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCsv = (camp: Campaign) => {
    const headers = ['Recipient_Email', 'Recipient_Name', 'Status', 'Timestamp', 'Message_ID', 'Error'];
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
    link.setAttribute('download', `${camp.name.replace(/\s+/g, '_')}_logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Campaigns</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View dispatch history, per-student delivery logs, and delivery metrics.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-md transition ${
              statusFilter === 'all' ? 'bg-white text-slate-900 font-medium shadow-xs' : 'text-slate-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-md transition ${
              statusFilter === 'completed' ? 'bg-white text-slate-900 font-medium shadow-xs' : 'text-slate-600'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1 rounded-md transition ${
              statusFilter === 'cancelled' ? 'bg-white text-slate-900 font-medium shadow-xs' : 'text-slate-600'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No campaigns found</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first email campaign to begin sending.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Sent / Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCampaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 max-w-xs truncate">
                      {camp.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                      {camp.subject}
                    </td>
                    <td className="px-5 py-3.5 font-mono tabular-nums text-slate-700">
                      <span className="font-semibold text-slate-900">{camp.sentCount}</span> / {camp.totalCount}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          camp.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {new Date(camp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedCampaign(camp)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                      >
                        Logs
                      </button>
                      <button
                        onClick={() => handleExportCsv(camp)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 transition"
                        title="Download CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCampaign(camp.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign Logs Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full shadow-xl flex flex-col max-h-[85vh] overflow-hidden text-slate-800 text-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">{selectedCampaign.name}</h3>
                <p className="text-[11px] text-slate-400">
                  {selectedCampaign.sentCount} sent of {selectedCampaign.totalCount} total recipients
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCsv(selectedCampaign)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-3">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Recipient</th>
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Message ID / Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {(selectedCampaign.deliveryLogs || []).map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-sans">
                          {log.status === 'success' ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sent
                            </span>
                          ) : (
                            <span className="text-rose-700 font-medium flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> {log.status}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-900 font-medium truncate max-w-xs">
                          {log.email}
                        </td>
                        <td className="px-3 py-2 text-slate-400">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-3 py-2 text-slate-400 truncate max-w-xs">
                          {log.messageId ? log.messageId : log.error}
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
