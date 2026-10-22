import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Users,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  Mail,
  Zap
} from 'lucide-react';
import { OrganizerUser } from '../types';
import { GMAIL_SEND_SCOPE } from '../services/auth';
import { GoogleAuthCard } from './GoogleAuthCard';

interface SettingsViewProps {
  organizer: OrganizerUser;
  onClearWorkspace: () => void;
  onLogout: () => void;
  onSwitchOrganizer: (name: string, email: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  organizer,
  onClearWorkspace,
  onLogout,
  onSwitchOrganizer
}) => {
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedWebhookScript, setCopiedWebhookScript] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState(organizer.dispatcherWebhookUrl || '');
  const [webhookSaved, setWebhookSaved] = useState(false);

  const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /organizers/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: false;
    }
  }
}`;

  const DISPATCHER_SCRIPT = `function doPost(e) {
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

  const handleSaveWebhook = () => {
    const trimmed = webhookUrlInput.trim();
    organizer.dispatcherWebhookUrl = trimmed || undefined;
    if (trimmed) {
      localStorage.setItem(`letsmail_webhook_${organizer.uid}`, trimmed);
    } else {
      localStorage.removeItem(`letsmail_webhook_${organizer.uid}`);
    }
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Settings &amp; Workspace Privacy</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your sender profile, Google OAuth permissions, Zero-GCP Dispatcher Webhook, and data isolation.
        </p>
      </div>

      {/* Google Authentication Card (Connected State) */}
      <GoogleAuthCard
        organizer={organizer}
        onDisconnect={onLogout}
        onManageAccount={() =>
          window.open('https://myaccount.google.com/permissions', '_blank', 'noopener,noreferrer')
        }
        showLogo={true}
        className="max-w-none"
      />

      {/* OAuth Scope & Token Security Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium">Granted OAuth Scope</span>
          <p className="font-mono text-[11px] text-slate-800 break-all">{GMAIL_SEND_SCOPE}</p>
          <p className="text-[10.5px] text-slate-400">Least-privilege permission required to transmit messages.</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium">Token Security</span>
          <p className="font-medium text-emerald-700 text-xs">In-Memory Session Caching Only</p>
          <p className="text-[10.5px] text-slate-400">Tokens are never saved in unencrypted browser storage.</p>
        </div>
      </div>

      {/* Zero-GCP Dispatcher Webhook Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Zero-GCP Dispatcher Webhook</h3>
            <p className="text-slate-500 text-[11px]">
              Allows your co-organizers to send emails without configuring Google Cloud Console or adding test users.
            </p>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
            Alternative Dispatcher
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed text-[11px]">
          Deploy this 15-line script as a Web App in <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">script.google.com</a> under any Google account. Paste the resulting Web App URL below, and Let's Mail will route transmissions through it with zero Google Cloud hurdles!
        </p>

        {/* Script & Copy */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-medium text-slate-600 font-mono">Dispatcher.gs</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(DISPATCHER_SCRIPT);
                setCopiedWebhookScript(true);
                setTimeout(() => setCopiedWebhookScript(false), 2000);
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              {copiedWebhookScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWebhookScript ? 'Copied' : 'Copy Script'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] max-h-36 overflow-y-auto leading-relaxed">
            {DISPATCHER_SCRIPT}
          </pre>
        </div>

        {/* URL Input */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-slate-700 font-medium text-xs">Your Web App URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={webhookUrlInput}
              onChange={(e) => setWebhookUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-indigo-500"
            />
            <button
              onClick={handleSaveWebhook}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs transition"
            >
              Save URL
            </button>
          </div>
          {webhookSaved && (
            <p className="text-[11px] text-emerald-700 font-medium">
              Saved! Transmissions will route through this webhook.
            </p>
          )}
        </div>
      </div>

      {/* Multi-Organizer Testing Sandbox */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
        <div>
          <h3 className="font-semibold text-sm text-slate-900">Multi-Organizer Workspace Switcher</h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Test data isolation between different college committees without having to log out of Google.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div>
              <p className="font-semibold text-slate-900">Prof. Sarah Chen</p>
              <p className="text-slate-500 font-mono text-[11px]">techfest.lead@sbjit.edu.in</p>
            </div>
            <button
              onClick={() => onSwitchOrganizer('Prof. Sarah Chen (Tech Fest)', 'techfest.lead@sbjit.edu.in')}
              className="w-full py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition"
            >
              Switch to Tech Fest
            </button>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div>
              <p className="font-semibold text-slate-900">Rohan Verma</p>
              <p className="text-slate-500 font-mono text-[11px]">cultural.coord@sbjit.edu.in</p>
            </div>
            <button
              onClick={() => onSwitchOrganizer('Rohan Verma (Cultural Club)', 'cultural.coord@sbjit.edu.in')}
              className="w-full py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition"
            >
              Switch to Cultural Club
            </button>
          </div>
        </div>
      </div>

      {/* Firebase Spark Plan Security Rules */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">Firebase Spark Plan Data Isolation</h3>
          <button
            onClick={() => {
              navigator.clipboard.writeText(FIRESTORE_RULES);
              setCopiedRules(true);
              setTimeout(() => setCopiedRules(false), 2000);
            }}
            className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline"
          >
            {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRules ? 'Copied' : 'Copy firestore.rules'}</span>
          </button>
        </div>
        <p className="text-slate-500 text-[11px]">
          Enforces that Organizer A cannot read or write Organizer B's documents at the database security level:
        </p>
        <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
          {FIRESTORE_RULES}
        </pre>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-rose-200 rounded-xl p-6 shadow-xs space-y-3 text-xs">
        <div>
          <h3 className="font-semibold text-sm text-rose-700">Danger Zone: Reset Workspace</h3>
          <p className="text-slate-500 text-[11px]">
            Permanently clear all stored campaigns, logs, and form settings for{' '}
            <strong className="text-slate-800 font-mono">{organizer.email}</strong>.
          </p>
        </div>

        {confirmWipe ? (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setConfirmWipe(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmWipe(false);
                onClearWorkspace();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-xs"
            >
              Confirm Wipe Workspace
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmWipe(true)}
            className="px-3.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium transition"
          >
            Clear Workspace Data
          </button>
        )}
      </div>
    </div>
  );
};
