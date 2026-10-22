import React from 'react';
import {
  Send,
  Plus,
  Mail,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  Users
} from 'lucide-react';
import { Campaign, DailyQuotaUsage, GoogleFormAutomation, OrganizerUser, ScheduledJob, NavigationTab } from '../types';

interface DashboardViewProps {
  organizer: OrganizerUser;
  quota: DailyQuotaUsage;
  campaigns: Campaign[];
  formAutomations: GoogleFormAutomation[];
  scheduledJobs: ScheduledJob[];
  onNavigate: (tab: NavigationTab) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  organizer,
  quota,
  campaigns,
  formAutomations,
  scheduledJobs,
  onNavigate,
  onRefresh
}) => {
  const remainingAllowance = Math.max(0, quota.capLimit - quota.sentCount);
  const activeAutomations = formAutomations.filter((a) => a.enabled);
  const pendingSchedules = scheduledJobs.filter((s) => s.status === 'pending');

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back, {organizer.displayName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch bulk college announcements, tickets, and Google Form response emails directly through{' '}
            <span className="font-mono text-slate-700 font-medium">{organizer.email}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('create-campaign')}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Row of Real Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Emails Sent Today */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Emails Sent Today</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{quota.sentCount}</span>
            <span className="text-xs text-slate-400 font-medium">via Gmail API</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            {quota.failedCount} failed transmission errors
          </p>
        </div>

        {/* Metric 2: Remaining Allowance */}
        <div
          onClick={() => onNavigate('activity')}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-slate-300 transition cursor-pointer"
        >
          <span className="text-xs font-medium text-slate-500">Daily Allowance Left</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold text-emerald-600 tabular-nums">
              {remainingAllowance}
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">/ {quota.capLimit} cap</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">Resets rolling 24-hours</p>
        </div>

        {/* Metric 3: Scheduled In Queue */}
        <div
          onClick={() => onNavigate('scheduled')}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-slate-300 transition cursor-pointer"
        >
          <span className="text-xs font-medium text-slate-500">Scheduled In Queue</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {pendingSchedules.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">Jobs</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">Automatic dispatch on schedule</p>
        </div>

        {/* Metric 4: Form Automations */}
        <div
          onClick={() => onNavigate('form-automation')}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-slate-300 transition cursor-pointer"
        >
          <span className="text-xs font-medium text-slate-500">Form Auto-Triggers</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {activeAutomations.length}
            </span>
            <span className="text-xs text-indigo-600 font-medium">Active</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">Instant Google Form confirmation</p>
        </div>
      </div>

      {/* Main Grid: Recent Campaigns & Right Sidebar Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Campaigns Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Recent Campaigns</h3>
                <p className="text-xs text-slate-500">Past dispatches and student communication</p>
              </div>
              {campaigns.length > 0 && (
                <button
                  onClick={() => onNavigate('campaigns')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {campaigns.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">No campaigns launched yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                    Upload a student list from CSV/Excel, personalize your template with tags, and dispatch in seconds.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('create-campaign')}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs shadow-xs hover:bg-indigo-500 transition"
                >
                  Create First Campaign
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {campaigns.slice(0, 5).map((camp) => (
                  <div
                    key={camp.id}
                    onClick={() => onNavigate('campaigns')}
                    className="px-5 py-3.5 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-4">
                      <p className="font-semibold text-slate-900 truncate">{camp.name}</p>
                      <p className="text-slate-500 truncate text-[11px]">{camp.subject}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {camp.sentCount}
                        </span>
                        <span className="text-slate-400"> / {camp.totalCount} sent</span>
                        <p className="text-[10px] text-slate-400">
                          {new Date(camp.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          camp.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Scheduled Dispatches */}
          {pendingSchedules.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-900">Upcoming Scheduled Dispatches</h3>
                <button
                  onClick={() => onNavigate('scheduled')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {pendingSchedules.slice(0, 3).map((job) => (
                  <div key={job.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{job.campaignName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {new Date(job.scheduledTime).toLocaleString()} ({job.timeZone})
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Google Form Status & Quick Links */}
        <div className="space-y-4">
          {/* Google Form Automation Status */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900">Google Form Trigger</h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                Apps Script
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              When a student submits your registration form, send an automatic branded entry ticket from your email.
            </p>

            {formAutomations.length > 0 ? (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <p className="font-semibold text-slate-900 truncate">{formAutomations[0].formName}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Prefix: {formAutomations[0].participantIdPrefix}</span>
                  <span className="font-semibold text-emerald-600">
                    {formAutomations[0].totalSent} auto-sent
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No form attached yet.</p>
            )}

            <button
              onClick={() => onNavigate('form-automation')}
              className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs transition"
            >
              Configure Form Trigger
            </button>
          </div>

          {/* Quick Guidance Card */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-semibold text-sm text-slate-900">Zero-Billing Architecture</h3>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                Let's Mail does not use paid third-party email providers. Emails are sent straight from your authentic Gmail inbox:
              </p>
              <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                <div>&bull; <strong>Gmail REST API:</strong> 500 emails / day</div>
                <div>&bull; <strong>Google Apps Script:</strong> 100 emails / day</div>
                <div>&bull; <strong>College Domain:</strong> 2,000 emails / day</div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('activity')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <span>Inspect Quota Specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
