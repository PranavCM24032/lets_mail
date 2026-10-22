import React, { useState } from 'react';
import { Mail, FileText, LogOut, Key, Webhook, X, Check } from 'lucide-react';
import { NavigationTab, OrganizerUser } from '../types';

interface TopHeaderProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  organizer: OrganizerUser;
  accessToken: string;
  quotaRemaining: number;
  quotaLimit: number;
  onLogout: () => void;
  onReauthorize: () => void;
  onUpdateWebhook: (url: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onSelectTab,
  organizer,
  accessToken,
  quotaRemaining,
  quotaLimit,
  onLogout,
  onReauthorize,
  onUpdateWebhook
}) => {
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [tempWebhookUrl, setTempWebhookUrl] = useState(organizer.dispatcherWebhookUrl || '');
  const [webhookSavedFeedback, setWebhookSavedFeedback] = useState(false);

  // Only built-in mock organizers are demos; real accounts must never be
  // treated as simulated based on their email address.
  const isDemoUser = organizer.uid.startsWith('org_');

  const isTokenMissing = !accessToken && !organizer.dispatcherWebhookUrl && !isDemoUser;
  const sentToday = Math.max(0, quotaLimit - quotaRemaining);

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWebhook(tempWebhookUrl.trim());
    setWebhookSavedFeedback(true);
    setTimeout(() => {
      setWebhookSavedFeedback(false);
      setShowWebhookModal(false);
    }, 1200);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900">Let's Mail</span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  100% Free
                </span>
              </div>
            </div>
          </div>

          {/* Center: The Two Core Navigation Tabs */}
          <nav className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            <button
              onClick={() => onSelectTab('bulk-email')}
              type="button"
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                currentTab === 'bulk-email'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload CSV &amp; Bulk Email</span>
              <span className="sm:hidden">Bulk Email</span>
            </button>

            <button
              onClick={() => onSelectTab('form-automation')}
              type="button"
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                currentTab === 'form-automation'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Form Auto-Email</span>
              <span className="sm:hidden">Google Forms</span>
            </button>
          </nav>

          {/* Right: Status, Webhook, Account */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* If Token Missing: Visible Authorize Button */}
            {isTokenMissing && (
              <button
                onClick={onReauthorize}
                type="button"
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition animate-pulse cursor-pointer"
                title="Your Gmail sending session needs authorization to dispatch emails"
              >
                <Key className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Authorize Gmail</span>
                <span className="md:hidden">Authorize</span>
              </button>
            )}

            {/* Apps Script Webhook config toggle */}
            <button
              onClick={() => setShowWebhookModal(true)}
              type="button"
              className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                organizer.dispatcherWebhookUrl
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
              title={
                organizer.dispatcherWebhookUrl
                  ? 'Apps Script Webhook active'
                  : 'Connect optional Google Apps Script Webhook'
              }
            >
              <Webhook className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">
                {organizer.dispatcherWebhookUrl ? 'Webhook Active' : 'Webhook'}
              </span>
            </button>

            {/* Daily Quota Indicator */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-800 font-medium"
              title="Emails sent today and remaining under your Gmail daily cap (resets midnight Pacific Time)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                <strong className="font-mono">{sentToday}</strong> sent &middot;{' '}
                <strong className="font-mono">{quotaRemaining}</strong>/{quotaLimit} left today
              </span>
            </div>

            {/* Connected Gmail Address Chip */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              {organizer.photoURL ? (
                <img
                  src={organizer.photoURL}
                  alt={organizer.displayName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center">
                  {organizer.displayName ? organizer.displayName[0].toUpperCase() : 'O'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-slate-900 leading-tight truncate max-w-[130px]">
                  {organizer.displayName}
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-mono text-slate-500 truncate max-w-[110px]">
                    {organizer.email}
                  </p>
                  {isDemoUser && (
                    <span className="text-[9px] font-medium px-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Demo
                    </span>
                  )}
                </div>
              </div>

              {/* Disconnect Button */}
              <button
                onClick={onLogout}
                type="button"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition cursor-pointer"
                title="Disconnect account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile quota bar */}
        <div className="md:hidden px-4 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{sentToday} sent &middot; {quotaRemaining}/{quotaLimit} left</span>
          </span>
          <span className="font-mono text-slate-500 truncate max-w-[180px]">{organizer.email}</span>
        </div>
      </header>

      {/* Apps Script Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Webhook className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Apps Script Webhook (Zero-OAuth)</h3>
                  <p className="text-[11px] text-slate-500">Optional sending fallback without OAuth tokens</p>
                </div>
              </div>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If you prefer not using OAuth tokens or want an alternative sending path, deploy a Google Apps Script Web App that executes{' '}
              <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono">MailApp.sendEmail()</code> and paste its web deployment URL here.
            </p>

            <form onSubmit={handleSaveWebhook} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apps Script Web App URL
                </label>
                <input
                  type="url"
                  value={tempWebhookUrl}
                  onChange={(e) => setTempWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                />
              </div>

              {webhookSavedFeedback && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Webhook configuration saved successfully!</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {organizer.dispatcherWebhookUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTempWebhookUrl('');
                      onUpdateWebhook('');
                    }}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Disconnect Webhook
                  </button>
                ) : <span />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWebhookModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-xs"
                  >
                    Save Webhook
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
