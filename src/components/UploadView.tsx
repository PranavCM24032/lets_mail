import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  ArrowRight,
  Filter,
  Search,
  Check,
  RefreshCw
} from 'lucide-react';
import { Recipient } from '../types';
import {
  parseRecipientFile,
  ParseResult,
  generateSampleCsvContent,
  reprocessWithEmailColumn
} from '../services/fileParser';

interface UploadViewProps {
  onRecipientsLoaded: (recipients: Recipient[], headers: string[], fileName: string) => void;
  existingRecipients?: Recipient[];
}

export const UploadView: React.FC<UploadViewProps> = ({
  onRecipientsLoaded,
  existingRecipients = []
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterDuplicates, setFilterDuplicates] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmailCol, setSelectedEmailCol] = useState('');
  const [selectedNameCol, setSelectedNameCol] = useState('');
  const [rawFile, setRawFile] = useState<File | null>(null);

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await parseRecipientFile(file);
      setParseResult(result);
      setSelectedEmailCol(result.detectedEmailCol);
      setSelectedNameCol(result.detectedNameCol);
      setRawFile(file);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error processing spreadsheet file');
      setParseResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = generateSampleCsvContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'letsmail_sample_college_students.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Re-evaluate when column selector changes
  const handleColumnChange = async (newEmailCol: string, newNameCol: string) => {
    setSelectedEmailCol(newEmailCol);
    setSelectedNameCol(newNameCol);
    if (rawFile) {
      setIsLoading(true);
      try {
        const result = await parseRecipientFile(rawFile);
        // reprocess
        const reprocessed = reprocessWithEmailColumn(
          result.recipients.map((r) => r.data),
          result.headers,
          newEmailCol,
          newNameCol,
          rawFile.name
        );
        setParseResult(reprocessed);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const displayedRecipients = (parseResult?.recipients || []).filter((r) => {
    if (filterDuplicates && r.isDuplicate) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.email.toLowerCase().includes(q) ||
      (r.name && r.name.toLowerCase().includes(q)) ||
      Object.values(r.data).some((val) => String(val).toLowerCase().includes(q))
    );
  });

  const validToProceedCount = (parseResult?.recipients || []).filter((r) => {
    if (filterDuplicates && r.isDuplicate) return false;
    return r.isValid;
  }).length;

  const handleProceed = () => {
    if (!parseResult) return;
    const finalRecipients = parseResult.recipients.filter((r) => {
      if (filterDuplicates && r.isDuplicate) return false;
      return true; // We keep both valid and invalid, invalid will be highlighted in composer
    });
    onRecipientsLoaded(finalRecipients, parseResult.headers, parseResult.fileName);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Upload Recipient List</h2>
          <p className="text-slate-400 text-xs mt-1">
            Import Excel (.xlsx, .xls) or CSV files with student attendees, participant IDs, and event tracks.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-blue-400" />
          Download Sample CSV Template
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition cursor-pointer flex flex-col items-center justify-center gap-4 ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner">
          <Upload className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">
            {isLoading ? 'Parsing spreadsheet...' : 'Choose or drag & drop your student file here'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Supports <strong>.CSV</strong>, <strong>.XLSX</strong>, and <strong>.XLS</strong> spreadsheets
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span>Accepted headers: name, email, event, participant_id, login_link</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-semibold text-rose-200">Failed to read file</p>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Processed Results & Preview Table */}
      {parseResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* File summary bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">{parseResult.fileName}</h3>
                <p className="text-xs text-slate-400">
                  {parseResult.totalRows} total rows found &bull; {parseResult.headers.length} columns detected
                </p>
              </div>
            </div>

            {/* Validation Metrics Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {parseResult.validCount} Valid Emails
              </span>

              {parseResult.invalidCount > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  {parseResult.invalidCount} Invalid Syntax
                </span>
              )}

              {parseResult.duplicateCount > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {parseResult.duplicateCount} Duplicates
                </span>
              )}
            </div>
          </div>

          {/* Column Mapping Controls */}
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Recipient Email Column <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedEmailCol}
                onChange={(e) => handleColumnChange(e.target.value, selectedNameCol)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-blue-500 font-mono"
              >
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Recipient Name Column (Optional)
              </label>
              <select
                value={selectedNameCol}
                onChange={(e) => handleColumnChange(selectedEmailCol, e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-blue-500 font-mono"
              >
                <option value="">(None / Guess from email)</option>
                {parseResult.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center md:items-end">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs w-full">
                <input
                  type="checkbox"
                  checked={filterDuplicates}
                  onChange={(e) => setFilterDuplicates(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className="text-slate-300">Exclude Duplicate Emails</span>
              </label>
            </div>
          </div>

          {/* Search & Table Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search attendee by name, email or event..."
                className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="text-xs text-slate-400">
              Showing {displayedRecipients.length} of {parseResult.recipients.length} records
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-850 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Attendee Name</th>
                  {parseResult.headers
                    .filter((h) => h !== selectedEmailCol && h !== selectedNameCol)
                    .map((h) => (
                      <th key={h} className="px-4 py-3">
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {displayedRecipients.map((r, index) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-850/50 transition ${
                      !r.isValid ? 'bg-rose-500/5' : r.isDuplicate ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-2.5 font-sans">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : r.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" /> Duplicate
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400"
                          title={r.validationError}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Invalid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-white truncate max-w-xs">{r.email}</td>
                    <td className="px-4 py-2.5 font-sans text-slate-200 truncate max-w-xs">
                      {r.name || <span className="text-slate-600 italic">None</span>}
                    </td>
                    {parseResult.headers
                      .filter((h) => h !== selectedEmailCol && h !== selectedNameCol)
                      .map((h) => (
                        <td key={h} className="px-4 py-2.5 text-slate-400 truncate max-w-xs">
                          {r.data[h] || '-'}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Ready to send: <strong className="text-emerald-400">{validToProceedCount}</strong> valid unique students.
            </div>

            <button
              onClick={handleProceed}
              disabled={validToProceedCount === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <span>Proceed to Email Composer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
