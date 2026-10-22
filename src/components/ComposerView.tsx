import React, { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  LayoutTemplate,
  Code,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MailCheck,
  Plus
} from 'lucide-react';
import { Recipient, EmailTemplate, OrganizerUser } from '../types';
import { DEFAULT_TEMPLATES, renderTemplate, extractPlaceholders } from '../services/templateEngine';
import { sendEmailViaGmailApi } from '../services/gmail';
import { ConfirmationModal } from './ConfirmationModal';

interface ComposerViewProps {
  recipients: Recipient[];
  headers: string[];
  organizer: OrganizerUser;
  accessToken: string;
  quotaRemaining: number;
  onStartBulkSending: (campaign: {
    name: string;
    subject: string;
    bodyHtml: string;
    recipients: Recipient[];
  }) => void;
  onNavigateToUpload: () => void;
}

export const ComposerView: React.FC<ComposerViewProps> = ({
  recipients,
  headers,
  organizer,
  accessToken,
  quotaRemaining,
  onStartBulkSending,
  onNavigateToUpload
}) => {
  const [campaignName, setCampaignName] = useState('College Event Announcement — Spring 2026');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(DEFAULT_TEMPLATES[0]);
  const [subjectTemplate, setSubjectTemplate] = useState(DEFAULT_TEMPLATES[0].defaultSubject);
  const [bodyTemplate, setBodyTemplate] = useState(DEFAULT_TEMPLATES[0].htmlContent);
  const [previewRecipientIndex, setPreviewRecipientIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('preview');

  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState(organizer.email);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Available merge tags based on headers and standard tags
  const standardTags = ['{name}', '{email}', '{event}', '{participant_id}', '{login_link}'];
  const customTags = headers
    .map((h) => `{${h}}`)
    .filter((tag) => !standardTags.includes(tag.toLowerCase()));
  const allAvailableTags = Array.from(new Set([...standardTags, ...customTags]));

  // Switch template
  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setSubjectTemplate(template.defaultSubject);
    setBodyTemplate(template.htmlContent);
  };

  const insertTagIntoSubject = (tag: string) => {
    setSubjectTemplate((prev) => prev + ' ' + tag);
  };

  const insertTagIntoBody = (tag: string) => {
    setBodyTemplate((prev) => prev + '\n' + tag);
  };

  // Preview recipient
  const currentPreviewRecipient =
    recipients.length > 0
      ? recipients[previewRecipientIndex]
      : {
          id: 'sample_01',
          email: organizer.email || 'student.sample@sbjit.edu.in',
          name: 'Aarav Sharma',
          data: {
            name: 'Aarav Sharma',
            email: organizer.email || 'student.sample@sbjit.edu.in',
            event: 'National AI Hackathon 2026',
            participant_id: 'REG-AI-1042',
            login_link: 'https://portal.sbjit.edu/checkin/1042'
          },
          isValid: true
        };

  const renderedSubject = renderTemplate(subjectTemplate, currentPreviewRecipient);
  const renderedBody = renderTemplate(bodyTemplate, currentPreviewRecipient);

  // Test Email Sender
  const handleSendTestEmail = async () => {
    if (!testEmailAddress) return;
    setIsSendingTest(true);
    setTestResult(null);

    const testSubject = `[TEST EMAIL] ${renderedSubject}`;
    const result = await sendEmailViaGmailApi({
      toEmail: testEmailAddress,
      toName: 'Organizer Test',
      fromEmail: organizer.email,
      fromName: organizer.displayName,
      subject: testSubject,
      bodyHtml: renderedBody,
      accessToken,
      dispatcherWebhookUrl: organizer.dispatcherWebhookUrl
    });

    setIsSendingTest(false);
    if (result.success) {
      setTestResult({
        success: true,
        message: result.isSimulated
          ? `[Test Mode] Verified RFC-2822 email payload and simulated delivery to ${testEmailAddress}.`
          : `Live test email dispatched successfully to ${testEmailAddress}! Check your inbox.`
      });
    } else {
      setTestResult({
        success: false,
        message: result.error || 'Failed to dispatch test email.'
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Email Composer &amp; Live Preview</h2>
          <p className="text-slate-400 text-xs mt-1">
            Design responsive HTML emails with personalized merge variables and instant preview for each student.
          </p>
        </div>

        {recipients.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {recipients.length} recipients loaded
            </span>
            <button
              onClick={onNavigateToUpload}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Change file
            </button>
          </div>
        ) : (
          <button
            onClick={onNavigateToUpload}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold"
          >
            Upload Recipient File
          </button>
        )}
      </div>

      {/* Campaign Details Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Internal Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Hackathon Pass Dispatch 2026"
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-medium"
            />
          </div>

          {/* Template Selection Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <LayoutTemplate className="w-3.5 h-3.5 text-blue-400" />
              Choose Email Template Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DEFAULT_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate.id === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold truncate">{tmpl.name}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{tmpl.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Merge Tag Chips */}
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Available Dynamic Personalization Tags (Click to Insert):
              </span>
              <span className="text-slate-500 font-mono">Substituted per student row</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allAvailableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => insertTagIntoSubject(tag)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-400 text-[11px] font-mono border border-slate-700 transition flex items-center gap-1"
                  title="Click to insert into subject"
                >
                  <Plus className="w-3 h-3" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Subject Line
            </label>
            <input
              type="text"
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
              placeholder="e.g. Your Pass for {event} — ID: {participant_id}"
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Editor & Preview Split Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1 bg-slate-850 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'preview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Personalized Preview
              </button>
              <button
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'editor'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                HTML Source
              </button>
            </div>

            {/* Recipient Carousel Switcher */}
            {viewMode === 'preview' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 hidden sm:inline">Previewing Student:</span>
                <button
                  onClick={() =>
                    setPreviewRecipientIndex((prev) =>
                      prev > 0 ? prev - 1 : Math.max(0, recipients.length - 1)
                    )
                  }
                  disabled={recipients.length <= 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-40"
                  title="Previous recipient"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-white font-semibold">
                  {recipients.length > 0 ? previewRecipientIndex + 1 : 1} / {Math.max(1, recipients.length)}
                </span>
                <button
                  onClick={() =>
                    setPreviewRecipientIndex((prev) =>
                      prev < recipients.length - 1 ? prev + 1 : 0
                    )
                  }
                  disabled={recipients.length <= 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-40"
                  title="Next recipient"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Body Content Area */}
          {viewMode === 'editor' ? (
            <div className="space-y-2">
              <textarea
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                rows={14}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 font-mono focus:outline-hidden focus:border-blue-500 leading-relaxed"
                placeholder="Enter HTML or plain text email content with {tags}..."
              />
              <p className="text-[11px] text-slate-500">
                Tip: Standard inline CSS and tables work best across Gmail mobile and desktop clients.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Preview Header Metadata */}
              <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">To:</span>
                  <span className="font-mono font-medium text-white truncate max-w-md">
                    {currentPreviewRecipient.name ? `"${currentPreviewRecipient.name}" ` : ''}&lt;
                    {currentPreviewRecipient.email}&gt;
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">From:</span>
                  <span className="font-mono font-medium text-blue-400 truncate max-w-md">
                    "{organizer.displayName}" &lt;{organizer.email}&gt;
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-750 pt-1.5">
                  <span className="text-slate-400">Rendered Subject:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-md">
                    {renderedSubject}
                  </span>
                </div>
              </div>

              {/* Rendered HTML Container */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden">
                <div
                  className="rounded-xl overflow-hidden bg-white text-slate-900 min-h-[360px]"
                  dangerouslySetInnerHTML={{ __html: renderedBody }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Test Email Section */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <MailCheck className="w-4 h-4 text-emerald-400" />
              Send a Real Test Email First
            </span>
            <span className="text-slate-400 text-[11px]">Recommended before full batch</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="Your email address to receive test message..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-blue-500"
            />
            <button
              onClick={handleSendTestEmail}
              disabled={isSendingTest || !testEmailAddress}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs border border-slate-700 shrink-0 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSendingTest ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Sending...
                </>
              ) : (
                'Send Test Email'
              )}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Bottom Campaign Launch Button */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Total ready for dispatch:{' '}
            <strong className="text-white">
              {recipients.length > 0 ? recipients.length : '0 (Please upload a file)'}
            </strong>{' '}
            &bull; Remaining daily quota: <strong className="text-emerald-400">{quotaRemaining}</strong>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={recipients.length === 0}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Launch Bulk Campaign ({recipients.length})</span>
          </button>
        </div>
      </div>

      {/* Workspace Integration Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Confirm Bulk Campaign Dispatch"
        senderEmail={organizer.email}
        recipientCount={recipients.length}
        subjectPreview={renderedSubject}
        quotaRemaining={quotaRemaining}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          onStartBulkSending({
            name: campaignName,
            subject: subjectTemplate,
            bodyHtml: bodyTemplate,
            recipients
          });
        }}
      />
    </div>
  );
};
