import React, { useState } from 'react';
import {
  Upload,
  Mail,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';
import { Campaign, OrganizerUser, Recipient } from '../types';
import { CreateCampaignWizard } from './CreateCampaignWizard';

interface BulkEmailViewProps {
  organizer: OrganizerUser;
  accessToken: string;
  quotaRemaining: number;
  quotaLimit: number;
  campaigns: Campaign[];
  onDeleteCampaign: (id: string) => void;
  onDispatchCampaign: (campaign: {
    name: string;
    subject: string;
    bodyHtml: string;
    recipients: Recipient[];
  }) => void;
  onReauthorize?: () => Promise<string | null>;
  onRecordSentEmail?: () => void;
}

export const BulkEmailView: React.FC<BulkEmailViewProps> = ({
  organizer,
  accessToken,
  quotaRemaining,
  quotaLimit,
  campaigns,
  onDeleteCampaign,
  onDispatchCampaign,
  onReauthorize,
  onRecordSentEmail
}) => {
  const [showHistory, setShowHistory] = useState(false);

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
    link.download = `${camp.name.replace(/\s+/g, '_')}_delivery_logs.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <span>Upload CSV &amp; Send Bulk Customized Emails</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload your recipient spreadsheet, customize subject &amp; body with placeholders like{' '}
            <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono text-[11px]">{'{name}'}</code> and{' '}
            <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono text-[11px]">{'{event}'}</code>, preview for each student, and dispatch.
          </p>
        </div>

        {campaigns.length > 0 && (
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            type="button"
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Past Campaigns ({campaigns.length})</span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        )}
      </div>

      {/* Single-page composer: recipients, content, and dispatch */}
      <CreateCampaignWizard
        organizer={organizer}
        accessToken={accessToken}
        quotaRemaining={quotaRemaining}
        quotaLimit={quotaLimit}
        onDispatchCampaign={onDispatchCampaign}
        onCancel={() => {}}
        onReauthorize={onReauthorize}
        onRecordSentEmail={onRecordSentEmail}
      />

      {/* Collapsible Past Campaigns Sent History */}
      {showHistory && campaigns.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Recent Sent Campaigns</h3>
              <p className="text-xs text-slate-500">History of dispatched bulk emails and delivery logs.</p>
            </div>
            <span className="text-xs text-slate-400">{campaigns.length} total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Campaign Name</th>
                  <th className="py-2.5 px-3 font-medium">Subject</th>
                  <th className="py-2.5 px-3 font-medium">Recipients</th>
                  <th className="py-2.5 px-3 font-medium">Sent / Failed</th>
                  <th className="py-2.5 px-3 font-medium">Date</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-medium text-slate-900">{camp.name}</td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-xs">{camp.subject}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{camp.totalCount}</td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-700 font-medium">{camp.sentCount} sent</span>
                      {camp.failedCount > 0 && (
                        <span className="text-rose-600 ml-1">({camp.failedCount} failed)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(camp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => handleExportCsv(camp)}
                        className="p-1 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                        title="Download Delivery CSV"
                      >
                        <Download className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete campaign "${camp.name}"?`)) {
                            onDeleteCampaign(camp.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
