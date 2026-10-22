import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Play,
  Pause,
  Trash2,
  Zap,
  Copy,
  Check,
  Info,
  Clock
} from 'lucide-react';
import { Campaign, OrganizerUser, ScheduledJob } from '../types';
import { generateAppsScriptSchedulerCode } from '../services/appsScriptGenerator';

interface ScheduledViewProps {
  organizer: OrganizerUser;
  campaigns: Campaign[];
  scheduledJobs: ScheduledJob[];
  onSaveJob: (job: ScheduledJob) => void;
  onDeleteJob: (id: string) => void;
  onTriggerNow: (job: ScheduledJob) => void;
}

export const ScheduledView: React.FC<ScheduledViewProps> = ({
  organizer,
  campaigns,
  scheduledJobs,
  onSaveJob,
  onDeleteJob,
  onTriggerNow
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCampId, setSelectedCampId] = useState(campaigns[0]?.id || '');
  const [dateTime, setDateTime] = useState('');
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    d.setMinutes(0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    setDateTime(`${y}-${m}-${day}T${h}:${min}`);
  }, []);

  const handleCreate = () => {
    const camp = campaigns.find((c) => c.id === selectedCampId) || campaigns[0];
    if (!camp || !dateTime) return;

    const targetDate = new Date(dateTime);
    const newJob: ScheduledJob = {
      id: `sched_${Date.now()}`,
      organizerUid: organizer.uid,
      campaignId: camp.id,
      campaignName: camp.name,
      scheduledTime: targetDate.toISOString(),
      timeZone,
      status: 'pending',
      createdAt: new Date().toISOString(),
      nextRunFormatted: targetDate.toLocaleString(),
      recipientCount: camp.totalCount || camp.recipients?.length || 0,
      lastResult: 'Queued'
    };

    onSaveJob(newJob);
    setShowModal(false);
  };

  const handleTogglePause = (job: ScheduledJob) => {
    onSaveJob({
      ...job,
      status: job.status === 'paused' ? 'pending' : 'paused'
    });
  };

  const handleCopyCloudCode = () => {
    const code = generateAppsScriptSchedulerCode();
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Scheduled Emails</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automate future event announcements, day-before reminder emails, and schedule dispatches.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={campaigns.length === 0}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Schedule Campaign</span>
        </button>
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <Info className="w-4 h-4 text-indigo-600" />
          Free-Tier Cloud Scheduling Options
        </div>
        <p className="leading-relaxed">
          Cloud Task Queues and server workers require paid billing.
          To keep Let's Mail 100% free with zero credit cards, you can dispatch via the <strong>In-Browser Active Runner</strong> while your tab is open, or use our free companion <strong>Google Apps Script Time-Driven Trigger</strong> that runs on Google's cloud 24/7 without needing your device.
        </p>
      </div>

      {/* Jobs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {scheduledJobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <CalendarClock className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No scheduled campaigns in queue</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Create a draft campaign in the Email Composer, then schedule it for future dispatch.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Scheduled Time</th>
                  <th className="px-5 py-3">Recipients</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scheduledJobs.map((job) => {
                  const isPending = job.status === 'pending';
                  const isPaused = job.status === 'paused';

                  return (
                    <tr key={job.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {job.campaignName}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px]">
                        {new Date(job.scheduledTime).toLocaleString()} ({job.timeZone})
                      </td>
                      <td className="px-5 py-3.5 font-mono tabular-nums text-slate-700">
                        {job.recipientCount}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            isPending
                              ? 'bg-blue-50 text-blue-700'
                              : isPaused
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                        {isPending && (
                          <button
                            onClick={() => onTriggerNow(job)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                          >
                            Dispatch Now
                          </button>
                        )}
                        <button
                          onClick={() => handleTogglePause(job)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 transition"
                          title={isPaused ? 'Resume' : 'Pause'}
                        >
                          {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-amber-600" />}
                        </button>
                        <button
                          onClick={() => onDeleteJob(job.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cloud Trigger Snippet Helper */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <p className="font-semibold text-slate-900">Need to dispatch while your phone or laptop is off?</p>
          <p className="text-slate-500 text-[11px]">
            Copy our free Apps Script time-driven trigger to execute on Google's cloud server.
          </p>
        </div>
        <button
          onClick={handleCopyCloudCode}
          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition self-start sm:self-auto shrink-0"
        >
          {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedSnippet ? 'Copied Snippet' : 'Copy Cloud Cron Snippet'}</span>
        </button>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-xl p-6 space-y-4 text-xs text-slate-800">
            <h3 className="font-semibold text-sm text-slate-900">Schedule Email Campaign</h3>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Choose Campaign</label>
              <select
                value={selectedCampId}
                onChange={(e) => setSelectedCampId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-indigo-500"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.totalCount || c.recipients.length} recipients)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Execution Time</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Timezone</label>
              <input
                type="text"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-xs"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
