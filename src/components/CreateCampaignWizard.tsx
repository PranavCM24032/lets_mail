import React, { useState, useRef } from 'react';
import {
  Upload,
  AlertTriangle,
  Download,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Send,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Recipient, EmailTemplate, OrganizerUser } from '../types';
import { parseRecipientFile, ParseResult, generateSampleCsvContent, reprocessWithEmailColumn } from '../services/fileParser';
import { DEFAULT_TEMPLATES, renderTemplate } from '../services/templateEngine';
import { sendEmailViaGmailApi } from '../services/gmail';
import { ConfirmationModal } from './ConfirmationModal';

interface CreateCampaignWizardProps {
  organizer: OrganizerUser;
  accessToken: string;
  quotaRemaining: number;
  initialRecipients?: Recipient[];
  initialHeaders?: string[];
  initialFileName?: string;
  onDispatchCampaign: (campaign: {
    name: string;
    subject: string;
    bodyHtml: string;
    recipients: Recipient[];
  }) => void;
  onCancel: () => void;
  onReauthorize?: () => Promise<string | null>;
}

export const CreateCampaignWizard: React.FC<CreateCampaignWizardProps> = ({
  organizer,
  accessToken,
  quotaRemaining,
  initialRecipients = [],
  initialHeaders = [],
  initialFileName = '',
  onDispatchCampaign,
  onCancel,
  onReauthorize
}) => {
  // Step state: 1 = Recipients, 2 = Compose, 3 = Review & Send
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(initialRecipients.length > 0 ? 2 : 1);

  // --- Step 1: Recipients State ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);
  const [headers, setHeaders] = useState<string[]>(initialHeaders);
  const [fileName, setFileName] = useState<string>(initialFileName);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [selectedEmailCol, setSelectedEmailCol] = useState<string>('');
  const [selectedNameCol, setSelectedNameCol] = useState<string>('');
  const [filterDuplicates, setFilterDuplicates] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  // --- Step 2: Compose State ---
  const [campaignName, setCampaignName] = useState('College Event Notice');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(DEFAULT_TEMPLATES[0]);
  const [subjectTemplate, setSubjectTemplate] = useState(DEFAULT_TEMPLATES[0].defaultSubject);
  const [bodyTemplate, setBodyTemplate] = useState(DEFAULT_TEMPLATES[0].htmlContent);
  const [composeView, setComposeView] = useState<'editor' | 'preview'>('preview');
  const [previewIndex, setPreviewIndex] = useState(0);

  // Test email state
  const [testEmail, setTestEmail] = useState(organizer.email);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Check if simulated / demo account or has valid sending credentials
  const isSimulatedAccount =
    organizer.uid.startsWith('org_') ||
    organizer.email.includes('@sbjit.edu') ||
    organizer.email.includes('demo') ||
    organizer.email.includes('test');

  const hasSendingAuth = Boolean(accessToken || organizer.dispatcherWebhookUrl || isSimulatedAccount);

  // --- Step 3: Confirmation Modal ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Handle file upload
  const handleFile = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const result = await parseRecipientFile(file);
      setParseResult(result);
      setRecipients(result.recipients);
      setHeaders(result.headers);
      setFileName(file.name);
      setFileSizeStr(`${(file.size / 1024).toFixed(1)} KB`);
      setSelectedEmailCol(result.detectedEmailCol);
      setSelectedNameCol(result.detectedNameCol);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Error reading spreadsheet file');
    } finally {
      setIsParsing(false);
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

  // Change mapped email / name columns
  const handleColumnRemap = (newEmailCol: string, newNameCol: string) => {
    setSelectedEmailCol(newEmailCol);
    setSelectedNameCol(newNameCol);
    if (parseResult) {
      const reprocessed = reprocessWithEmailColumn(
        parseResult.recipients.map((r) => r.data),
        parseResult.headers,
        newEmailCol,
        newNameCol,
        fileName
      );
      setParseResult(reprocessed);
      setRecipients(reprocessed.recipients);
    }
  };

  // Filtered recipient count
  const validRecipients = recipients.filter((r) => {
    if (filterDuplicates && r.isDuplicate) return false;
    return r.isValid;
  });

  const duplicateCount = recipients.filter((r) => r.isDuplicate).length;
  const invalidCount = recipients.filter((r) => !r.isValid && !r.isDuplicate).length;

  // Personalization tags
  const standardTags = ['{name}', '{email}', '{event}', '{participant_id}', '{login_link}'];
  const customTags = headers
    .map((h) => `{${h}}`)
    .filter((tag) => !standardTags.includes(tag.toLowerCase()));
  const allAvailableTags = Array.from(new Set([...standardTags, ...customTags]));

  const currentPreviewRecipient = validRecipients[previewIndex] || {
    id: 'sample',
    email: organizer.email || 'attendee@college.edu',
    name: 'Aarav Sharma',
    data: {
      name: 'Aarav Sharma',
      email: organizer.email || 'attendee@college.edu',
      event: 'National AI Hackathon 2026',
      participant_id: 'REG-AI-1042',
      login_link: 'https://portal.sbjit.edu/checkin/1042'
    },
    isValid: true
  };

  const renderedSubject = renderTemplate(subjectTemplate, currentPreviewRecipient);
  const renderedBody = renderTemplate(bodyTemplate, currentPreviewRecipient);

  // Send real test email
  const handleSendTest = async () => {
    if (!testEmail) return;
    setIsSendingTest(true);
    setTestFeedback(null);

    let tokenToUse = accessToken;
    if (!tokenToUse && !organizer.dispatcherWebhookUrl && !isSimulatedAccount && onReauthorize) {
      try {
        const refreshed = await onReauthorize();
        if (refreshed) tokenToUse = refreshed;
      } catch {
        //
      }
    }

    const result = await sendEmailViaGmailApi({
      toEmail: testEmail,
      toName: 'Test Recipient',
      fromEmail: organizer.email,
      fromName: organizer.displayName,
      subject: `[TEST] ${renderedSubject}`,
      bodyHtml: renderedBody,
      accessToken: tokenToUse,
      dispatcherWebhookUrl: organizer.dispatcherWebhookUrl
    });

    setIsSendingTest(false);
    if (result.success) {
      setTestFeedback({
        success: true,
        message: result.isSimulated
          ? `[Test Mode] Verified RFC-2822 email payload and simulated delivery to ${testEmail}.`
          : `Live test email dispatched successfully to ${testEmail}! Check your inbox.`
      });
    } else {
      setTestFeedback({
        success: false,
        message: result.error || 'Failed to dispatch test email.'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Stepper Indicator */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          {/* Step 1 */}
          <div
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep === 1
                  ? 'bg-indigo-600 text-white'
                  : currentStep > 1
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </div>
            <span
              className={`text-xs font-medium ${
                currentStep === 1 ? 'text-slate-900 font-semibold' : 'text-slate-500'
              }`}
            >
              Recipients
            </span>
          </div>

          <div className="flex-1 h-px bg-slate-200 mx-4" />

          {/* Step 2 */}
          <div
            onClick={() => validRecipients.length > 0 && setCurrentStep(2)}
            className={`flex items-center gap-2 ${
              validRecipients.length > 0 ? 'cursor-pointer' : 'opacity-50'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep === 2
                  ? 'bg-indigo-600 text-white'
                  : currentStep > 2
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
            </div>
            <span
              className={`text-xs font-medium ${
                currentStep === 2 ? 'text-slate-900 font-semibold' : 'text-slate-500'
              }`}
            >
              Compose
            </span>
          </div>

          <div className="flex-1 h-px bg-slate-200 mx-4" />

          {/* Step 3 */}
          <div
            onClick={() => validRecipients.length > 0 && setCurrentStep(3)}
            className={`flex items-center gap-2 ${
              validRecipients.length > 0 ? 'cursor-pointer' : 'opacity-50'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep === 3
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              3
            </div>
            <span
              className={`text-xs font-medium ${
                currentStep === 3 ? 'text-slate-900 font-semibold' : 'text-slate-500'
              }`}
            >
              Review &amp; Send
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: RECIPIENTS */}
      {currentStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-semibold text-base text-slate-900">Step 1 — Upload Recipient List</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload CSV or Excel spreadsheets containing attendee names, emails, and event registration details.
              </p>
            </div>
            <button
              onClick={handleDownloadSample}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample CSV</span>
            </button>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-8 text-center cursor-pointer transition hover:bg-slate-50 flex flex-col items-center justify-center gap-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                {isParsing ? 'Processing spreadsheet...' : 'Click to upload or drag & drop'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">CSV, XLSX, or XLS files</p>
            </div>
          </div>

          {parseError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {parseError}
            </div>
          )}

          {/* Parsed File Summary & Mapping */}
          {recipients.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-900 font-mono">{fileName || 'Uploaded List'}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {recipients.length} rows detected {fileSizeStr && `(${fileSizeStr})`} &bull; {headers.length} columns
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-medium text-emerald-700">
                    {validRecipients.length} Valid
                  </span>
                  {duplicateCount > 0 && (
                    <span className="text-amber-700">
                      {duplicateCount} Duplicates
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="text-rose-700">
                      {invalidCount} Invalid
                    </span>
                  )}
                </div>
              </div>

              {/* Column Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Recipient Email Column <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedEmailCol}
                    onChange={(e) => handleColumnRemap(e.target.value, selectedNameCol)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-mono"
                  >
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Recipient Name Column
                  </label>
                  <select
                    value={selectedNameCol}
                    onChange={(e) => handleColumnRemap(selectedEmailCol, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-mono"
                  >
                    <option value="">(None / Guess from email)</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterDuplicates}
                      onChange={(e) => setFilterDuplicates(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-slate-700">Filter Duplicate Emails</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              disabled={validRecipients.length === 0}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <span>Continue to Compose</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: COMPOSE */}
      {currentStep === 2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-semibold text-base text-slate-900">Step 2 — Design Email &amp; Live Preview</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Personalize your message with merge tags and test email delivery before bulk dispatch.
              </p>
            </div>
            <span className="text-xs text-slate-500">
              Recipients: <strong className="text-slate-900">{validRecipients.length}</strong>
            </span>
          </div>

          {/* Campaign Title & Template Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Campaign Title</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Hackathon Pass Dispatch 2026"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Template Selector Pills */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Select Template</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEFAULT_TEMPLATES.map((tmpl) => {
                  const isSel = selectedTemplate.id === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedTemplate(tmpl);
                        setSubjectTemplate(tmpl.defaultSubject);
                        setBodyTemplate(tmpl.htmlContent);
                      }}
                      className={`p-3 rounded-lg border text-left transition ${
                        isSel
                          ? 'bg-indigo-50/60 border-indigo-500 text-indigo-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-medium truncate">{tmpl.name}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{tmpl.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Merge Tag Chips */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium text-slate-700">Click to insert placeholder:</span>
                <span>Populated from uploaded columns</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allAvailableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSubjectTemplate((prev) => prev + ' ' + tag)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 text-[11px] font-mono transition"
                    title="Click to insert into subject"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject Line</label>
              <input
                type="text"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Editor / Preview Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setComposeView('preview')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    composeView === 'preview'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Live Preview
                </button>
                <button
                  onClick={() => setComposeView('editor')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    composeView === 'editor'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  HTML Editor
                </button>
              </div>

              {composeView === 'preview' && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Recipient:</span>
                  <button
                    onClick={() => setPreviewIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, validRecipients.length - 1)))}
                    disabled={validRecipients.length <= 1}
                    className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-slate-900 font-medium">
                    {validRecipients.length > 0 ? previewIndex + 1 : 1} / {Math.max(1, validRecipients.length)}
                  </span>
                  <button
                    onClick={() => setPreviewIndex((prev) => (prev < validRecipients.length - 1 ? prev + 1 : 0))}
                    disabled={validRecipients.length <= 1}
                    className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {composeView === 'editor' ? (
              <textarea
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                rows={12}
                className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">To:</span>
                    <span className="font-mono text-slate-900 font-medium truncate max-w-sm">
                      {currentPreviewRecipient.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rendered Subject:</span>
                    <span className="font-semibold text-slate-900 truncate max-w-sm">
                      {renderedSubject}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <div
                    className="bg-white rounded-lg p-4 min-h-[320px] shadow-xs"
                    dangerouslySetInnerHTML={{ __html: renderedBody }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Test Email Row */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Send Test Email</span>
              <span className="text-slate-400 text-[11px]">Delivers rendered email to your inbox</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
                placeholder="your.email@college.edu"
              />
              <button
                onClick={handleSendTest}
                disabled={isSendingTest || !testEmail}
                className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-medium transition shrink-0 disabled:opacity-50"
              >
                {isSendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
            {testFeedback && (
              <p
                className={`text-[11px] font-medium ${
                  testFeedback.success ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {testFeedback.message}
              </p>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Recipients</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition"
            >
              <span>Continue to Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & SEND */}
      {currentStep === 3 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="pb-4 border-b border-slate-200">
            <h3 className="font-semibold text-base text-slate-900">Step 3 — Review &amp; Dispatch</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review final campaign parameters before executing bulk transmission through your authorized account.
            </p>
          </div>

          {/* Summary Box */}
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-3.5 bg-slate-50 flex justify-between items-center">
              <span className="text-slate-500">Sender Account:</span>
              <span className="font-mono text-slate-900 font-medium">{organizer.email}</span>
            </div>
            <div className="p-3.5 bg-white flex justify-between items-center">
              <span className="text-slate-500">Total Valid Recipients:</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {validRecipients.length} students
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 flex justify-between items-center">
              <span className="text-slate-500">Subject Preview:</span>
              <span className="font-medium text-slate-800 truncate max-w-sm">{renderedSubject}</span>
            </div>
            <div className="p-3.5 bg-white flex justify-between items-center">
              <span className="text-slate-500">Daily Quota Status:</span>
              <span className="font-semibold text-emerald-700">
                {quotaRemaining} allowance remaining today
              </span>
            </div>
          </div>

          {/* Missing Auth Warning Card */}
          {!hasSendingAuth && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Gmail Sending Authorization Required</p>
                  <p className="text-amber-700 mt-0.5 leading-relaxed">
                    Your session requires Gmail sending permissions to dispatch emails from{' '}
                    <strong className="font-mono text-amber-950">{organizer.email}</strong>.
                  </p>
                </div>
              </div>
              {onReauthorize && (
                <button
                  type="button"
                  onClick={async () => {
                    setIsAuthorizing(true);
                    try {
                      await onReauthorize();
                    } finally {
                      setIsAuthorizing(false);
                    }
                  }}
                  disabled={isAuthorizing}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs transition shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isAuthorizing ? 'Authorizing...' : 'Authorize Gmail Now'}
                </button>
              )}
            </div>
          )}

          {/* Warnings & Notices */}
          {validRecipients.length > quotaRemaining ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Quota Warning:</strong> You have {validRecipients.length} recipients, but only{' '}
                {quotaRemaining} left today under Google's daily cap. The dispatcher will send {quotaRemaining} and safely pause.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                Each message will be transmitted individually through your authenticated account with direct inbox deliverability.
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Editor</span>
            </button>
            <button
              onClick={async () => {
                if (!hasSendingAuth && onReauthorize) {
                  setIsAuthorizing(true);
                  try {
                    const freshToken = await onReauthorize();
                    if (!freshToken) return;
                  } catch {
                    return;
                  } finally {
                    setIsAuthorizing(false);
                  }
                }
                setShowConfirmModal(true);
              }}
              disabled={isAuthorizing}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isAuthorizing
                  ? 'Connecting Gmail...'
                  : `Dispatch Campaign (${validRecipients.length})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Confirm Campaign Dispatch"
        senderEmail={organizer.email}
        recipientCount={validRecipients.length}
        subjectPreview={renderedSubject}
        quotaRemaining={quotaRemaining}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          onDispatchCampaign({
            name: campaignName,
            subject: subjectTemplate,
            bodyHtml: bodyTemplate,
            recipients: validRecipients
          });
        }}
      />
    </div>
  );
};
