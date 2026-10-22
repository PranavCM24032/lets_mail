import React, { useState } from 'react';
import {
  Users,
  Search,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { Recipient } from '../types';
import { generateSampleCsvContent } from '../services/fileParser';

interface ContactsViewProps {
  recipients: Recipient[];
  headers: string[];
  fileName?: string;
  onNavigateToUpload: () => void;
  onNavigateToCompose: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  recipients,
  headers,
  fileName,
  onNavigateToUpload,
  onNavigateToCompose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'invalid' | 'duplicate'>('all');

  const filtered = recipients.filter((r) => {
    const matchesSearch =
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      Object.values(r.data).some((val) => String(val).toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'valid') return r.isValid;
    if (statusFilter === 'duplicate') return r.isDuplicate;
    if (statusFilter === 'invalid') return !r.isValid && !r.isDuplicate;
    return true;
  });

  const validCount = recipients.filter((r) => r.isValid).length;
  const duplicateCount = recipients.filter((r) => r.isDuplicate).length;
  const invalidCount = recipients.filter((r) => !r.isValid && !r.isDuplicate).length;

  const handleDownloadSample = () => {
    const csvContent = generateSampleCsvContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'college_attendees_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Contacts &amp; Recipient Lists</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student participant rosters, verify email syntax, and identify duplicates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSample}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Sample CSV
          </button>
          <button
            onClick={onNavigateToUpload}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-medium">Total In File</span>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{recipients.length}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-emerald-700 font-medium">Valid Syntax</span>
          <p className="text-xl font-bold text-emerald-700 tabular-nums mt-0.5">{validCount}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-amber-700 font-medium">Duplicates Flagged</span>
          <p className="text-xl font-bold text-amber-700 tabular-nums mt-0.5">{duplicateCount}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-rose-700 font-medium">Syntax Errors</span>
          <p className="text-xl font-bold text-rose-700 tabular-nums mt-0.5">{invalidCount}</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attendees by name, email, event..."
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
            All ({recipients.length})
          </button>
          <button
            onClick={() => setStatusFilter('valid')}
            className={`px-3 py-1 rounded-md transition ${
              statusFilter === 'valid' ? 'bg-white text-slate-900 font-medium shadow-xs' : 'text-slate-600'
            }`}
          >
            Valid ({validCount})
          </button>
          <button
            onClick={() => setStatusFilter('duplicate')}
            className={`px-3 py-1 rounded-md transition ${
              statusFilter === 'duplicate' ? 'bg-white text-slate-900 font-medium shadow-xs' : 'text-slate-600'
            }`}
          >
            Duplicates ({duplicateCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {recipients.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No contacts loaded yet</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Upload a spreadsheet or sample CSV to view parsed student records.
            </p>
            <button
              onClick={onNavigateToUpload}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs shadow-xs hover:bg-indigo-500 transition"
            >
              Upload Spreadsheet
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Event</th>
                  <th className="px-4 py-2.5">Participant ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-400 font-sans">{i + 1}</td>
                    <td className="px-4 py-2 font-sans">
                      {r.isValid ? (
                        <span className="text-emerald-700 font-medium">Valid</span>
                      ) : r.isDuplicate ? (
                        <span className="text-amber-700 font-medium">Duplicate</span>
                      ) : (
                        <span className="text-rose-700 font-medium">Invalid</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-900 font-medium">{r.email}</td>
                    <td className="px-4 py-2 text-slate-600 font-sans">{r.name || '-'}</td>
                    <td className="px-4 py-2 text-slate-600 font-sans">{r.data['event'] || '-'}</td>
                    <td className="px-4 py-2 text-slate-600">{r.data['participant_id'] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {recipients.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={onNavigateToCompose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition"
          >
            <span>Proceed to Campaign Composer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
