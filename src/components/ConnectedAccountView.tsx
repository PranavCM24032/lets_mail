import React, { useState } from 'react';
import {
  Mail,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Key,
  CheckCircle2,
  Lock,
  Copy,
  Check
} from 'lucide-react';
import { OrganizerUser } from '../types';
import { GMAIL_SEND_SCOPE } from '../services/auth';

interface ConnectedAccountViewProps {
  organizer: OrganizerUser;
  tokenStatus: 'active' | 'expired' | 'simulated';
  onLogout: () => void;
  onRefreshAuth: () => void;
}

export const ConnectedAccountView: React.FC<ConnectedAccountViewProps> = ({
  organizer,
  tokenStatus,
  onLogout,
  onRefreshAuth
}) => {
  const [copiedScope, setCopiedScope] = useState(false);

  const handleCopyScope = () => {
    navigator.clipboard.writeText(GMAIL_SEND_SCOPE);
    setCopiedScope(true);
    setTimeout(() => setCopiedScope(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Page Title */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white tracking-tight">Connected Google Account</h2>
        <p className="text-slate-400 text-xs">
          Manage your authorized Gmail connection, granted OAuth permissions, and privacy controls.
        </p>
      </div>

      {/* Account Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {organizer.photoURL ? (
              <img
                src={organizer.photoURL}
                alt={organizer.displayName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/40 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                {organizer.displayName ? organizer.displayName[0].toUpperCase() : 'O'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{organizer.displayName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{organizer.email}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">UID: {organizer.uid}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshAuth}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              Re-authorize Session
            </button>
            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>

        {/* OAuth Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Key className="w-4 h-4 text-blue-400" />
              Granted Google OAuth Scope
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 flex items-center justify-between">
              <span className="truncate pr-2">{GMAIL_SEND_SCOPE}</span>
              <button
                onClick={handleCopyScope}
                className="text-slate-400 hover:text-white p-1 rounded transition shrink-0"
                title="Copy scope"
              >
                {copiedScope ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Least-privilege permission required to transmit messages from your account on your command. We do NOT request permission to read your inbox.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400" />
              Token Security Architecture
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              In-Memory Session Caching Only
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              OAuth access tokens are never persisted in unencrypted browser storage (localStorage). When you close the tab, the memory token clears immediately.
            </p>
          </div>
        </div>

        {/* Step-by-Step Revocation Guide */}
        <div className="p-5 rounded-2xl bg-slate-850/60 border border-slate-800 space-y-3 text-xs">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            How to Revoke Permissions from your Google Account
          </h4>
          <p className="text-slate-300 leading-relaxed">
            If you ever wish to completely remove Let's Mail's access from your Google account at the security level:
          </p>

          <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
            <li>
              Go to your official Google Account Security dashboard at{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
              >
                myaccount.google.com/permissions
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Locate <strong>Let's Mail</strong> under "Third-party apps with account access".</li>
            <li>Click <strong>Remove Access</strong> to immediately invalidate all OAuth tokens.</li>
          </ol>
        </div>

        {/* Multi-Organizer Notice */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200/90 leading-relaxed">
          <strong>Multi-Organizer Isolation:</strong> Other organizers using Let's Mail on their devices have separate workspaces. They cannot see your campaigns, your student contact lists, your templates, or send from your address.
        </div>
      </div>

      {/* Zero-GCP Personal Webhook Alternative Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Ultra-Simple Zero-GCP Dispatcher (For Any Organizer Account)
              </h3>
              <p className="text-xs text-slate-400">
                Want your co-organizers to send emails without configuring Google Cloud Console or adding test users?
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
            No Setup Hurdles
          </span>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Google OAuth requires adding email addresses to Google Cloud's "Test users" list while in testing mode.
            To bypass that completely for any student organizer, use your private <strong>Google Apps Script Webhook</strong>.
            It deploys directly under your Google account in 60 seconds with <strong>zero credit card and zero Google Cloud configuration</strong>!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
              <span className="font-bold text-white block">Step 1</span>
              Open <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-mono">script.google.com</a> and click <strong>New project</strong>.
            </div>
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
              <span className="font-bold text-white block">Step 2</span>
              Paste the 15-line script below and click <strong>Deploy &gt; New deployment &gt; Web app</strong>.
            </div>
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
              <span className="font-bold text-white block">Step 3</span>
              Set "Who has access" to <strong>Anyone</strong>, copy your Web App URL, and paste it below!
            </div>
          </div>
        </div>

        {/* Script Viewer & Copy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 font-mono">Dispatcher.gs (Runs on your personal Google account)</span>
            <button
              onClick={() => {
                const script = `function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    GmailApp.sendEmail(data.toEmail, data.subject, "", {
      htmlBody: data.bodyHtml,
      name: data.fromName || "Event Committee"
    });
    return ContentService.createTextOutput(JSON.stringify({ success: true, messageId: "as_" + Date.now() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
function doGet(e) {
  return ContentService.createTextOutput("Let's Mail Dispatcher Ready: " + Session.getActiveUser().getEmail());
}`;
                navigator.clipboard.writeText(script);
                alert("Copied 15-line Dispatcher script to clipboard!");
              }}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Dispatcher Code
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-purple-300 overflow-x-auto leading-relaxed">
{`function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    GmailApp.sendEmail(data.toEmail, data.subject, "", {
      htmlBody: data.bodyHtml,
      name: data.fromName || "Event Committee"
    });
    return ContentService.createTextOutput(JSON.stringify({ success: true, messageId: "as_" + Date.now() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
          </pre>
        </div>

        {/* Input for Dispatcher Webhook URL */}
        <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
          <label className="block text-xs font-semibold text-white">
            Your Personal Dispatcher Webhook URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              defaultValue={organizer.dispatcherWebhookUrl || ''}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              id="webhookInput"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-purple-500"
            />
            <button
              onClick={() => {
                const el = document.getElementById('webhookInput') as HTMLInputElement;
                if (el) {
                  organizer.dispatcherWebhookUrl = el.value.trim();
                  localStorage.setItem(`letsmail_webhook_${organizer.uid}`, el.value.trim());
                  alert('Saved personal dispatcher webhook URL! Bulk emails will now dispatch via this endpoint.');
                }
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition"
            >
              Save Webhook URL
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            When configured, Let's Mail will route your bulk campaigns through this URL directly from your personal Google account.
          </p>
        </div>
      </div>
    </div>
  );
};
