import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  BookOpen,
  Activity
} from 'lucide-react';
import { DailyQuotaUsage, OrganizerUser } from '../types';

interface QuotaDashboardViewProps {
  organizer: OrganizerUser;
  quota: DailyQuotaUsage;
}

export const QuotaDashboardView: React.FC<QuotaDashboardViewProps> = ({
  organizer,
  quota
}) => {
  const remainingQuota = Math.max(0, quota.capLimit - quota.sentCount);
  const usedPercent = Math.min(100, Math.round((quota.sentCount / quota.capLimit) * 100));

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxHourlyCount = Math.max(1, ...Object.values(quota.hourlyBreakdown));

  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Email Activity &amp; Daily Quotas</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time tracking of Gmail API daily allowances, hourly transmission rates, and provider caps.
        </p>
      </div>

      {/* Main Quota Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dial Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-slate-100"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`${
                  remainingQuota === 0 ? 'text-rose-600' : remainingQuota < 100 ? 'text-amber-500' : 'text-indigo-600'
                } transition-all duration-700 ease-out`}
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * usedPercent) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-slate-900 tabular-nums">{remainingQuota}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Left Today
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-slate-900">
              {remainingQuota > 0 ? 'Quota Healthy' : 'Daily Quota Exhausted'}
            </h4>
            <p className="text-[11px] text-slate-500">
              {quota.sentCount} sent of {quota.capLimit} cap ({usedPercent}% consumed)
            </p>
          </div>

          <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Resets in: <strong className="text-slate-800 font-mono">{diffHours}h {diffMinutes}m</strong></span>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <div>
                <span className="text-slate-400">Authenticated Sender</span>
                <p className="font-mono font-medium text-slate-900">{organizer.email}</p>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                Standard Gmail Quota
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[11px] text-slate-500">Success Rate</span>
                <p className="text-xl font-bold text-emerald-700 tabular-nums mt-0.5">
                  {quota.sentCount + quota.failedCount > 0
                    ? `${Math.round((quota.sentCount / (quota.sentCount + quota.failedCount)) * 100)}%`
                    : '100%'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[11px] text-slate-500">Total Sent</span>
                <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{quota.sentCount}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[11px] text-slate-500">API Errors</span>
                <p className="text-xl font-bold text-rose-700 tabular-nums mt-0.5">{quota.failedCount}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Google limits consumer <code>@gmail.com</code> accounts to 500 recipients per rolling 24 hours.
                Let's Mail strictly enforces this threshold to protect your account standing.
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-mono">
            Last logged transmission: {new Date(quota.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* 24-Hour Distribution Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Today's Hourly Distribution</h3>
            <p className="text-xs text-slate-500">Emails dispatched per hour over the last 24 hours</p>
          </div>
          <span className="text-xs font-mono text-slate-500">Peak hour: {maxHourlyCount} emails</span>
        </div>

        <div className="pt-4 pb-2">
          <div className="h-28 flex items-end gap-1.5 sm:gap-2">
            {hours.map((hour) => {
              const count = quota.hourlyBreakdown[hour] || 0;
              const barHeight = count > 0 ? Math.max(14, Math.round((count / maxHourlyCount) * 100)) : 4;

              return (
                <div key={hour} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div
                    className={`w-full rounded-t transition-all ${
                      count > 0 ? 'bg-indigo-600 group-hover:bg-indigo-500' : 'bg-slate-100'
                    }`}
                    style={{ height: `${barHeight}%` }}
                    title={`${hour}:00 - ${hour}:59 : ${count} emails`}
                  />
                  <span className="text-[9px] text-slate-400 font-mono">
                    {hour % 3 === 0 ? `${hour}h` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Technical Explanation Card: Gmail API vs Apps Script */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Technical Analysis: Gmail API (500/day) vs. Google Apps Script (100/day)
              </h3>
              <p className="text-xs text-slate-500">
                Understanding Google's architectural quotas and safe sending boundaries.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase tracking-wider self-start sm:self-auto">
            Official Google Specs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Card 1: Gmail API */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Gmail REST API
                </span>
                <span className="font-bold text-slate-900 font-mono">500 emails / day</span>
              </div>
              <h4 className="font-semibold text-slate-900">Bulk Campaign Sender (OAuth 2.0)</h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                When you dispatch bulk batches in Let's Mail, the app communicates directly with Google's Gmail API (<code>users.messages.send</code>) using your authorized OAuth token.
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-500 pt-1">
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Quota Window:</strong> Rolling 24-hour evaluation per user account.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Cap Error:</strong> HTTP 403 <code>dailyLimitExceeded</code>.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Workspace Tier:</strong> <strong>2,000 / day</strong> for college domains.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <a
                href="https://support.google.com/mail/answer/22839"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
              >
                <span>Read Google Support: Gmail Sending Limits</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Card 2: Apps Script */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Google Apps Script
                </span>
                <span className="font-bold text-purple-700 font-mono">100 recipients / day</span>
              </div>
              <h4 className="font-semibold text-slate-900">Google Form Automations</h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                When students submit a Google Form, the <code>onFormSubmit</code> script executes on Google's multi-tenant serverless infrastructure using <code>GmailApp.sendEmail()</code>.
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-500 pt-1">
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                  <span><strong>Quota Window:</strong> Resets at Midnight Pacific Time (PT).</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                  <span><strong>Cap Error:</strong> <code>Service invoked too many times for one day</code>.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                  <span><strong>Workspace Tier:</strong> <strong>1,500 / day</strong> for college domains.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <a
                href="https://developers.google.com/apps-script/guides/services/quotas"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-700 hover:text-purple-800 flex items-center gap-1 font-medium"
              >
                <span>Read Google Developers: Apps Script Quotas</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Why difference exists */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-900">Why does Google have two different limits for the same account?</p>
          <p className="text-[11px]">
            Google provides higher allowances (500/day) for direct API/OAuth interactions because requests are authenticated per interactive user session.
            Google Apps Script runs autonomously on Google's free infrastructure, so Google enforces a lower daily threshold (100/day for consumer accounts) to protect shared compute clusters and deter automated spam scripting.
          </p>
        </div>
      </div>
    </div>
  );
};
