import React, { useState } from 'react';
import { FileText, Copy, Check, ExternalLink, CheckCircle2 } from 'lucide-react';

const APPS_SCRIPT_TEMPLATE = `/**
 * Sends a confirmation email when a Google Form is submitted.
 * Add this to the form's linked response Sheet, then create an
 * "On form submit" trigger.
 */
function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = e.values || [];

  const data = {};
  headers.forEach((header, index) => {
    const key = String(header || '').trim();
    if (key) data[key] = values[index] || '';
  });

  const email = data['Email Address'];
  if (!email) return;

  // Change these to match your event.
  data['event'] = 'YOUR EVENT NAME';
  data['participant_id'] = 'REG-' + new Date().getTime().toString().slice(-6);

  let subject = 'Confirmed: \${event} — ID \${participant_id}';
  let body = '<p>Dear \${name},</p>' +
    '<p>Your registration for <strong>\${event}</strong> is confirmed.</p>' +
    '<p>Your pass ID is <strong>\${participant_id}</strong>.</p>';

  Object.keys(data).forEach((key) => {
    const token = '\${' + key + '}';
    subject = subject.split(token).join(data[key]);
    body = body.split(token).join(data[key]);
  });

  MailApp.sendEmail({ to: email, subject: subject, htmlBody: body });
}`;

export const GoogleFormGuideView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
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
            text: 'Copy the script below into Code.gs. Update the email column name and event details to match your form.'
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

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Apps Script code</h3>
            <p className="text-[11px] text-slate-500">
              Placeholders like <code className="font-mono">{'${name}'}</code> are replaced with the
              matching form column. Use your exact column headers, e.g. <code className="font-mono">{'${Full Name}'}</code>.
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
          {APPS_SCRIPT_TEMPLATE}
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
