import React, { useState } from 'react';
import { FileText, Copy, Check, ExternalLink, CheckCircle2, Eye } from 'lucide-react';
import { Recipient } from '../types';
import { extractMergeFields, renderTemplate } from '../services/templateEngine';

const DEFAULT_SUBJECT = 'Confirmed: ${event} — ID ${participant_id}';
const DEFAULT_BODY =
  '<p>Dear ${name},</p>' +
  '<p>Your registration for <strong>${event}</strong> is confirmed.</p>' +
  '<p>Your pass ID is <strong>${participant_id}</strong>.</p>';

const buildScript = (
  eventName: string,
  emailColumn: string,
  nameColumn: string,
  subjectTemplate: string,
  bodyTemplate: string
) => `/**
 * Sends a confirmation email when a Google Form is submitted.
 * Add this to the form's linked response Sheet, then create an
 * "On form submit" trigger.
 */
function onFormSubmit(e) {
  var sheet = e.range.getSheet();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = e.values || [];

  var data = {};
  headers.forEach(function (header, index) {
    var key = String(header || '').trim();
    if (key) data[key] = values[index] || '';
  });

  var email = data[${JSON.stringify(emailColumn)}];
  if (!email) return;

  data['name'] = data[${JSON.stringify(nameColumn)}] || '';
  data['event'] = ${JSON.stringify(eventName)};
  data['participant_id'] = 'REG-' + new Date().getTime().toString().slice(-6);

  var subject = ${JSON.stringify(subjectTemplate)};
  var body = ${JSON.stringify(bodyTemplate)};

  Object.keys(data).forEach(function (key) {
    var token = '\${' + key + '}';
    subject = subject.split(token).join(data[key]);
    body = body.split(token).join(data[key]);
  });

  MailApp.sendEmail({ to: email, subject: subject, htmlBody: body });
}`;

const FORM_BUILTIN_FIELDS = new Set([
  'name',
  'email',
  'event',
  'event_name',
  'participant_id',
  'participantid',
  'id'
]);

const SAMPLE_PARTICIPANT_ID = 'REG-123456';

export const GoogleFormGuideView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [eventName, setEventName] = useState('Your Event');
  const [emailColumn, setEmailColumn] = useState('Email Address');
  const [nameColumn, setNameColumn] = useState('Full Name');
  const [subjectTemplate, setSubjectTemplate] = useState(DEFAULT_SUBJECT);
  const [bodyTemplate, setBodyTemplate] = useState(DEFAULT_BODY);
  const [sampleName, setSampleName] = useState('Ada Lovelace');
  const [sampleEmail, setSampleEmail] = useState('student@college.edu');

  const previewRecipient: Recipient = {
    id: 'preview',
    email: sampleEmail,
    name: sampleName,
    data: {
      name: sampleName,
      email: sampleEmail,
      event: eventName,
      participant_id: SAMPLE_PARTICIPANT_ID
    },
    isValid: true
  };

  const renderedSubject = renderTemplate(subjectTemplate, previewRecipient);
  const renderedBody = renderTemplate(bodyTemplate, previewRecipient);
  const mergeFields = extractMergeFields(`${subjectTemplate} ${bodyTemplate}`).map((key) => {
    const token = `\${${key}}`;
    const value = renderTemplate(token, previewRecipient);
    const normalized = key.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const missing = value === token && FORM_BUILTIN_FIELDS.has(normalized);
    return {
      token,
      value: value === token ? 'Filled from the form response' : value,
      missing
    };
  });

  const generatedScript = buildScript(
    eventName,
    emailColumn,
    nameColumn,
    subjectTemplate,
    bodyTemplate
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Form Email Guide</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Send automatic confirmation emails from a Google Form using Google Apps Script — free,
            with no app or server required.
          </p>
        </div>
        <a
          href="https://script.google.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Apps Script
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            title: 'Link your Form to a Sheet',
            text: 'Open your Google Form, go to the Responses tab, and click Link to Sheets. This creates a spreadsheet that receives every submission.'
          },
          {
            title: 'Open Apps Script',
            text: 'In that response spreadsheet, open Extensions → Apps Script. Delete any sample code in Code.gs.'
          },
          {
            title: 'Paste and adjust the script',
            text: 'Copy the script below into Code.gs. It already uses the event details and template from this page.'
          },
          {
            title: 'Add the form submit trigger',
            text: 'In Apps Script, open Triggers → Add Trigger. Choose onFormSubmit, select event type On form submit, and save.'
          }
        ].map((step, index) => (
          <div key={step.title} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-semibold flex items-center justify-center">
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-slate-900">{step.title}</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-semibold flex items-center justify-center">
            5
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Compose &amp; preview email</h3>
            <p className="text-[11px] text-slate-500">
              Edit the template, check the preview, then copy the generated script.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Email Column Header</label>
            <input
              type="text"
              value={emailColumn}
              onChange={(e) => setEmailColumn(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Name Column Header</label>
            <input
              type="text"
              value={nameColumn}
              onChange={(e) => setNameColumn(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="block text-slate-700 font-medium">Subject Line</label>
          <input
            type="text"
            value={subjectTemplate}
            onChange={(e) => setSubjectTemplate(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
          />
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="block text-slate-700 font-medium">Email Body (HTML)</label>
          <textarea
            value={bodyTemplate}
            onChange={(e) => setBodyTemplate(e.target.value)}
            rows={6}
            spellCheck={false}
            className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-hidden focus:border-indigo-500"
          />
          <p className="text-[10px] text-slate-400">
            Use {'${event}'}, {'${name}'}, {'${participant_id}'}, or any exact form column name.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-200">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              Email Preview
            </span>
            <span className="text-slate-400">Sample recipient</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            <input
              type="text"
              value={sampleName}
              onChange={(e) => setSampleName(e.target.value)}
              placeholder="Sample name"
              className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500"
            />
            <input
              type="email"
              value={sampleEmail}
              onChange={(e) => setSampleEmail(e.target.value)}
              placeholder="Sample email"
              className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="rounded-lg bg-white border border-slate-200 p-3 space-y-1 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">To:</span>
              <span className="font-mono text-slate-900 truncate max-w-sm">{sampleEmail}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Subject:</span>
              <span className="font-semibold text-slate-900 truncate max-w-sm">{renderedSubject}</span>
            </div>
          </div>

          <div
            className="rounded-lg bg-white border border-slate-200 p-4 text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-indigo-600 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: renderedBody }}
          />

          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-600">Merge field check</span>
              <span className="text-[10px] text-slate-500">
                {mergeFields.filter((field) => !field.missing).length}/{mergeFields.length} loaded
              </span>
            </div>
            {mergeFields.length === 0 ? (
              <p className="text-[10px] text-slate-400">No merge fields used in this template.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {mergeFields.map((field) => (
                  <div
                    key={field.token}
                    className={`rounded-md border px-2 py-1.5 text-[10px] ${
                      field.missing ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <code className="font-mono text-slate-700">{field.token}</code>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wide ${
                          field.missing ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {field.missing ? 'missing' : 'loaded'}
                      </span>
                    </div>
                    <p className={`mt-1 break-all ${field.missing ? 'text-rose-700' : 'text-slate-500'}`}>
                      {field.missing ? 'No matching form column' : field.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Apps Script code</h3>
            <p className="text-[11px] text-slate-500">
              Generated from the template above. Paste it into the Sheet's Apps Script editor.
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Script'}
          </button>
        </div>
        <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] max-h-96 overflow-auto leading-relaxed border border-slate-800">
          {generatedScript}
        </pre>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 space-y-1.5">
        <p className="font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Test it
        </p>
        <p>
          Submit the Google Form once with your own email. The script should send the confirmation
          email within a few seconds. If it does not, check the Apps Script execution log for errors.
        </p>
        <p className="text-emerald-800">
          Free Gmail accounts can send about 100 emails per day from Apps Script; Google Workspace
          accounts can send about 1,500 per day.
        </p>
      </div>

      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" />
        Once the trigger is set up, Google runs the script automatically. You can close this app.
      </p>
    </div>
  );
};
