import React, { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  Plus,
  Sparkles,
  Info,
  Pencil,
  Eye,
  Code2,
  Play,
  RotateCcw,
  CheckCheck
} from 'lucide-react';
import { GoogleFormAutomation, OrganizerUser, Recipient } from '../types';
import { generateFormAppsScriptCode } from '../services/appsScriptGenerator';
import { renderTemplate } from '../services/templateEngine';

interface FormAutomationViewProps {
  organizer: OrganizerUser;
  automations: GoogleFormAutomation[];
  onSaveAutomation: (automation: GoogleFormAutomation) => void;
  onDeleteAutomation: (id: string) => void;
}

const MESSAGE_PRESETS = [
  {
    name: 'Event Pass & Ticket',
    subject: 'Confirmed: {event} Registration — Pass ID {participant_id}',
    body: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #0f172a; margin: 0 0 8px;">Registration Confirmed!</h2>
    <p style="color: #64748b; font-size: 14px; margin: 0;">Welcome to <strong>{event}</strong></p>
  </div>
  <p style="color: #334155; font-size: 14px; line-height: 1.6;">Dear <strong>{name}</strong>,</p>
  <p style="color: #334155; font-size: 14px; line-height: 1.6;">Thank you for registering through our official Google Form. Your seat has been secured.</p>
  <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
    <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Official Attendee Pass ID</span>
    <span style="font-size: 22px; font-weight: bold; color: #4f46e5; font-family: monospace;">{participant_id}</span>
  </div>
  <p style="color: #475569; font-size: 13px; line-height: 1.5;">Please present this email or your Pass ID at the venue registration counter on arrival.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">Sent on behalf of the {event} Organizing Committee</p>
</div>`
  },
  {
    name: 'Guidelines & Instructions',
    subject: 'Guidelines & Entry Pass for {event} — ID {participant_id}',
    body: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
  <h2 style="color: #0f172a; margin-top: 0;">Hello {name},</h2>
  <p style="color: #334155; font-size: 14px; line-height: 1.6;">Your Google Form entry for <strong>{event}</strong> has been received!</p>
  <p style="color: #334155; font-size: 14px;"><strong>Your Attendee ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #4f46e5;">{participant_id}</span></p>
  <h3 style="color: #1e293b; font-size: 15px; margin-top: 18px;">Important Guidelines:</h3>
  <ul style="color: #475569; font-size: 13px; line-height: 1.6; padding-left: 20px;">
    <li>Carry your college photo identification card.</li>
    <li>Report to the main campus auditorium 15 minutes before opening.</li>
    <li>Keep your Attendee ID handy for attendance tracking.</li>
  </ul>
  <p style="color: #334155; font-size: 14px; margin-top: 20px;">We look forward to seeing you!</p>
</div>`
  },
  {
    name: 'Simple Confirmation Receipt',
    subject: 'Receipt: Your response to {event} was received ({participant_id})',
    body: `<p>Dear <strong>{name}</strong>,</p>
<p>We have successfully recorded your submission for <strong>{event}</strong>.</p>
<p>Registration Code: <strong style="color: #4f46e5; font-family: monospace;">{participant_id}</strong></p>
<p>If you have any questions or need to modify your registration details, simply reply to this email.</p>
<p>Warm regards,<br/>Campus Event Committee</p>`
  }
];

export const FormAutomationView: React.FC<FormAutomationViewProps> = ({
  organizer,
  automations,
  onSaveAutomation,
  onDeleteAutomation
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'guide'>('list');
  const [selectedAutomation, setSelectedAutomation] = useState<GoogleFormAutomation | null>(
    automations[0] || null
  );

  // Sub-view within selected trigger: 'edit-message' | 'script' | 'simulator'
  const [triggerView, setTriggerView] = useState<'edit-message' | 'script' | 'simulator'>('edit-message');

  // Preview toggle in message editor
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  // Active trigger edit form state
  const [editFormName, setEditFormName] = useState('');
  const [editEventName, setEditEventName] = useState('');
  const [editEmailColumn, setEditEmailColumn] = useState('');
  const [editNameColumn, setEditNameColumn] = useState('');
  const [editParticipantPrefix, setEditParticipantPrefix] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // New Form builder state
  const [newFormName, setNewFormName] = useState('Tech Fest 2026 Student Registration');
  const [newEventName, setNewEventName] = useState('National Tech Fest 2026');
  const [newEmailColumn, setNewEmailColumn] = useState('Email Address');
  const [newNameColumn, setNewNameColumn] = useState('Full Name');
  const [newParticipantPrefix, setNewParticipantPrefix] = useState('REG-TF-2026-');
  const [newSubjectTemplate, setNewSubjectTemplate] = useState('Confirmed: {event} Registration — ID {participant_id}');
  const [newBodyTemplate, setNewBodyTemplate] = useState(MESSAGE_PRESETS[0].body);

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // Test simulation state
  const [simEmail, setSimEmail] = useState(organizer.email || 'attendee@college.edu');
  const [simName, setSimName] = useState('Kavya Sharma');
  const [simSuccess, setSimSuccess] = useState<string | null>(null);

  // Synchronize edit fields when selectedAutomation changes
  useEffect(() => {
    if (selectedAutomation) {
      setEditFormName(selectedAutomation.formName);
      setEditEventName(selectedAutomation.eventName);
      setEditEmailColumn(selectedAutomation.emailColumn);
      setEditNameColumn(selectedAutomation.nameColumn);
      setEditParticipantPrefix(selectedAutomation.participantIdPrefix);
      setEditSubject(selectedAutomation.subject);
      setEditBody(selectedAutomation.templateBody);
    }
  }, [selectedAutomation]);

  // Keep selectedAutomation pointing to existing item if list updates
  useEffect(() => {
    if (automations.length > 0 && !selectedAutomation) {
      setSelectedAutomation(automations[0]);
    }
  }, [automations, selectedAutomation]);

  const handleCreateNew = () => {
    const newAuto: GoogleFormAutomation = {
      id: `form_auto_${Date.now()}`,
      organizerUid: organizer.uid,
      formName: newFormName,
      eventName: newEventName,
      emailColumn: newEmailColumn,
      nameColumn: newNameColumn,
      participantIdPrefix: newParticipantPrefix,
      subject: newSubjectTemplate,
      templateBody: newBodyTemplate,
      enabled: true,
      createdAt: new Date().toISOString(),
      totalSent: 0,
      recentLogs: []
    };
    onSaveAutomation(newAuto);
    setSelectedAutomation(newAuto);
    setActiveTab('list');
    setTriggerView('edit-message');
    setSaveSuccessMessage('Trigger created! You can customize its email message below.');
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  const handleSaveMessageUpdates = () => {
    if (!selectedAutomation) return;

    const updated: GoogleFormAutomation = {
      ...selectedAutomation,
      formName: editFormName.trim() || selectedAutomation.formName,
      eventName: editEventName.trim() || selectedAutomation.eventName,
      emailColumn: editEmailColumn.trim() || selectedAutomation.emailColumn,
      nameColumn: editNameColumn.trim() || selectedAutomation.nameColumn,
      participantIdPrefix: editParticipantPrefix.trim() || selectedAutomation.participantIdPrefix,
      subject: editSubject.trim() || selectedAutomation.subject,
      templateBody: editBody.trim() || selectedAutomation.templateBody
    };

    onSaveAutomation(updated);
    setSelectedAutomation(updated);
    setSaveSuccessMessage('Email message & settings updated! Google Apps Script code regenerated.');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const handleToggleEnable = (auto: GoogleFormAutomation) => {
    const updated = { ...auto, enabled: !auto.enabled };
    onSaveAutomation(updated);
    if (selectedAutomation?.id === auto.id) {
      setSelectedAutomation(updated);
    }
  };

  const currentDisplay: GoogleFormAutomation = selectedAutomation || automations[0] || {
    id: 'sample_auto',
    organizerUid: organizer.uid,
    formName: editFormName || 'College Event Form',
    eventName: editEventName || 'College Fest 2026',
    emailColumn: editEmailColumn || 'Email Address',
    nameColumn: editNameColumn || 'Full Name',
    participantIdPrefix: editParticipantPrefix || 'REG-',
    subject: editSubject || 'Registration Confirmation',
    templateBody: editBody || '<p>Thank you for registering!</p>',
    enabled: true,
    createdAt: new Date().toISOString(),
    totalSent: 0,
    recentLogs: []
  };

  const generatedScriptCode = generateFormAppsScriptCode(currentDisplay);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleInsertTag = (tag: string, field: 'subject' | 'body') => {
    if (field === 'subject') {
      setEditSubject((prev) => `${prev} ${tag}`);
    } else {
      setEditBody((prev) => `${prev}\n${tag}`);
    }
  };

  const handleRunSimulation = () => {
    const testId = `${currentDisplay.participantIdPrefix}${Math.floor(1000 + Math.random() * 9000)}`;
    const newLog = {
      id: `sim_${Date.now()}`,
      studentEmail: simEmail,
      studentName: simName,
      participantId: testId,
      timestamp: new Date().toLocaleTimeString(),
      status: 'success' as const,
      details: `Simulated form submit mapping ${currentDisplay.emailColumn} -> ${simEmail}`
    };

    const updated: GoogleFormAutomation = {
      ...currentDisplay,
      totalSent: currentDisplay.totalSent + 1,
      lastTriggered: new Date().toISOString(),
      recentLogs: [newLog, ...(currentDisplay.recentLogs || []).slice(0, 9)]
    };

    onSaveAutomation(updated);
    setSelectedAutomation(updated);
    setSimSuccess(`Verified! Generated ${testId} for ${simName}.`);
    setTimeout(() => setSimSuccess(null), 3500);
  };

  // Sample student preview rendering
  const previewRecipient: Recipient = {
    id: 'preview_1',
    email: 'aarav.sharma@sbjit.edu.in',
    name: 'Aarav Sharma',
    data: {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@sbjit.edu.in',
      event: editEventName || currentDisplay.eventName || 'Annual Tech Symposium',
      participant_id: `${editParticipantPrefix || currentDisplay.participantIdPrefix || 'REG-'}1082`
    },
    isValid: true
  };

  const renderedPreviewSubject = renderTemplate(
    editSubject || currentDisplay.subject,
    previewRecipient
  );

  const renderedPreviewBody = renderTemplate(
    editBody || currentDisplay.templateBody,
    previewRecipient
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Form Automations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliver instant, customized confirmation passes the moment students submit your Google Form.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'list'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
            }`}
          >
            Triggers ({automations.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'create'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Form Trigger</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
            }`}
          >
            Setup Guide
          </button>
        </div>
      </div>

      {/* Free Apps Script Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900">100% Free Cloud Architecture:</strong> Google Forms doesn't emit native webhooks without paid third-party tools.
          Let's Mail creates a companion <strong>Google Apps Script</strong> that attaches directly to your Google Sheet response tab.
          It executes 24/7 on Google's cloud on <code>onFormSubmit</code> and sends from your personal address with $0 hosting cost.
          <span className="text-slate-500 block text-[11px] mt-0.5">
            Apps Script email quota: 100 recipients/day for consumer @gmail.com accounts (1,500/day for college Workspace accounts).
          </span>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{saveSuccessMessage}</span>
        </div>
      )}

      {/* TAB 1: TRIGGER LIST & COMPONENT EDITOR */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Triggers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                Saved Triggers ({automations.length})
              </h3>
              <button
                onClick={() => setActiveTab('create')}
                className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Form
              </button>
            </div>

            {automations.length === 0 ? (
              <div className="p-8 rounded-xl bg-white border border-slate-200 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600">No form triggers saved yet.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium cursor-pointer"
                >
                  Create Your First Trigger
                </button>
              </div>
            ) : (
              automations.map((auto) => {
                const isSel = currentDisplay.id === auto.id;
                return (
                  <div
                    key={auto.id}
                    onClick={() => {
                      setSelectedAutomation(auto);
                      setTriggerView('edit-message');
                    }}
                    className={`p-4 rounded-xl border transition cursor-pointer space-y-2.5 ${
                      isSel
                        ? 'bg-indigo-50/50 border-indigo-400 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-slate-900 truncate">{auto.formName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{auto.eventName}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEnable(auto);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 cursor-pointer ${
                          auto.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {auto.enabled ? 'Active' : 'Paused'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="font-mono text-[10.5px]">Prefix: {auto.participantIdPrefix}</span>
                      <span className="font-medium text-slate-700">{auto.totalSent} auto-sent</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-1">
                        <Pencil className="w-3 h-3" />
                        Click to edit message
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete trigger for "${auto.formName}"?`)) {
                            onDeleteAutomation(auto.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                        title="Delete trigger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Active Trigger Detail & Message Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
              {/* Trigger Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-slate-900">{currentDisplay.formName}</h3>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                      Editable Template
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Event: <span className="text-slate-800 font-medium">{currentDisplay.eventName}</span> &bull; Sending to:{' '}
                    <code className="font-mono text-slate-700 bg-slate-50 px-1 py-0.5 rounded">{currentDisplay.emailColumn}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied Code!' : 'Copy Script'}</span>
                  </button>
                </div>
              </div>

              {/* Sub-view Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <button
                  onClick={() => setTriggerView('edit-message')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    triggerView === 'edit-message'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Message &amp; Template</span>
                </button>

                <button
                  onClick={() => setTriggerView('script')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    triggerView === 'script'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Apps Script Code</span>
                </button>

                <button
                  onClick={() => setTriggerView('simulator')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    triggerView === 'simulator'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Test Simulator ({currentDisplay.totalSent})</span>
                </button>
              </div>

              {/* SUB-VIEW 1: EDIT MESSAGE & TEMPLATE */}
              {triggerView === 'edit-message' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Preset Message Picker */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Apply Ready-Made Template Preset:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {MESSAGE_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setEditSubject(preset.subject);
                            setEditBody(preset.body);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-[11px] font-medium text-slate-700 transition cursor-pointer"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form & Event Details Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Form Name</label>
                      <input
                        type="text"
                        value={editFormName}
                        onChange={(e) => setEditFormName(e.target.value)}
                        placeholder="Google Form Name"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Event Name</label>
                      <input
                        type="text"
                        value={editEventName}
                        onChange={(e) => setEditEventName(e.target.value)}
                        placeholder="e.g. National Hackathon 2026"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Column Mappings Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Form Email Column
                      </label>
                      <input
                        type="text"
                        value={editEmailColumn}
                        onChange={(e) => setEditEmailColumn(e.target.value)}
                        placeholder="Email Address"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Form Name Column
                      </label>
                      <input
                        type="text"
                        value={editNameColumn}
                        onChange={(e) => setEditNameColumn(e.target.value)}
                        placeholder="Full Name"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">ID Prefix</label>
                      <input
                        type="text"
                        value={editParticipantPrefix}
                        onChange={(e) => setEditParticipantPrefix(e.target.value)}
                        placeholder="REG-2026-"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Subject Line Editor with Tag Buttons */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-medium">Confirmation Email Subject</label>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>Insert tag:</span>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{event}', 'subject')}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10.5px] cursor-pointer"
                        >
                          +{'{event}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{participant_id}', 'subject')}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10.5px] cursor-pointer"
                        >
                          +{'{participant_id}'}
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="e.g. Confirmed: {event} Pass — ID {participant_id}"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* HTML Body Editor & Variable Pills */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block text-slate-700 font-medium">
                        Confirmation Email Message (HTML &amp; Text)
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-400">Quick Tags:</span>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{name}', 'body')}
                          className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-[10.5px] cursor-pointer border border-indigo-100"
                        >
                          +{'{name}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{event}', 'body')}
                          className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-[10.5px] cursor-pointer border border-indigo-100"
                        >
                          +{'{event}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{participant_id}', 'body')}
                          className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-[10.5px] cursor-pointer border border-indigo-100"
                        >
                          +{'{participant_id}'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                          className={`ml-2 px-2 py-0.5 rounded border text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                            showHtmlPreview
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>{showHtmlPreview ? 'Hide Preview' : 'Live Preview'}</span>
                        </button>
                      </div>
                    </div>

                    {showHtmlPreview ? (
                      /* Live Visual Preview of Student Email */
                      <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-700">Student Inbox Preview:</span>
                          <span className="text-slate-400">Sample: Aarav Sharma</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900 pb-2">
                          Subject: <span className="font-normal text-slate-700">{renderedPreviewSubject}</span>
                        </div>
                        <div
                          className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs text-xs prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderedPreviewBody }}
                        />
                      </div>
                    ) : (
                      /* Raw HTML/Text Textarea */
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={8}
                        className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                        placeholder="Write confirmation email message..."
                      />
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-500">
                      Changes immediately update the Apps Script code generator.
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedAutomation) {
                            setEditSubject(selectedAutomation.subject);
                            setEditBody(selectedAutomation.templateBody);
                            setEditFormName(selectedAutomation.formName);
                            setEditEventName(selectedAutomation.eventName);
                          }
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveMessageUpdates}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Save &amp; Update Message</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2: GENERATED APPS SCRIPT CODE */}
              {triggerView === 'script' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Code.gs (Ready to paste into Google Sheet)</span>
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied to Clipboard' : 'Copy Full Code'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] max-h-72 overflow-y-auto leading-relaxed border border-slate-800">
                    {generatedScriptCode}
                  </pre>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-900">How to update in your Google Sheet:</p>
                    <p className="text-[11px] leading-relaxed">
                      1. Open your Form's linked Google Sheet &gt; <strong>Extensions &gt; Apps Script</strong>.
                      <br />
                      2. Replace all existing text in <code>Code.gs</code> with the updated code above, then click <strong>Save</strong>.
                      <br />
                      3. All future form submissions will instantly use this new confirmation email message!
                    </p>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 3: SIMULATION BOX & RECENT SUBMISSION LOGS */}
              {triggerView === 'simulator' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">Test Form Submission Simulator</span>
                      <span className="text-[11px] text-slate-400">Zero quota consumption</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Test Student Name</label>
                        <input
                          type="text"
                          value={simName}
                          onChange={(e) => setSimName(e.target.value)}
                          placeholder="Student Name"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Test Student Email</label>
                        <input
                          type="email"
                          value={simEmail}
                          onChange={(e) => setSimEmail(e.target.value)}
                          placeholder="Student Email"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      {simSuccess ? (
                        <span className="text-emerald-700 text-xs font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> {simSuccess}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Simulates the <code>onFormSubmit</code> event and tests variable mapping.
                        </span>
                      )}
                      <button
                        onClick={handleRunSimulation}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer shadow-2xs"
                      >
                        Simulate Submission
                      </button>
                    </div>
                  </div>

                  {/* Recent Submissions */}
                  {currentDisplay.recentLogs && currentDisplay.recentLogs.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Recent Submissions Log
                      </span>
                      <div className="divide-y divide-slate-100 text-xs bg-white border border-slate-200 rounded-xl px-4">
                        {currentDisplay.recentLogs.map((log) => (
                          <div key={log.id} className="py-2.5 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">
                                {log.studentName} &bull;{' '}
                                <span className="font-mono text-slate-500 text-[11px]">{log.studentEmail}</span>
                              </p>
                              <p className="text-[11px] text-indigo-600 font-mono font-medium">{log.participantId}</p>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">{log.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No submissions logged yet. Click "Simulate Submission" to test!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE NEW TRIGGER */}
      {activeTab === 'create' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-base text-slate-900">Configure New Google Form Trigger</h3>
              <p className="text-xs text-slate-500">
                Set up automated emails for a new Google Form or event registration sheet.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('list')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Back to Triggers
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Form Name</label>
              <input
                type="text"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                placeholder="e.g. Cultural Night 2026 Registration"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Event Name</label>
              <input
                type="text"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder="e.g. Annual Cultural Night 2026"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Form Email Column Header
              </label>
              <input
                type="text"
                value={newEmailColumn}
                onChange={(e) => setNewEmailColumn(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Form Name Column Header
              </label>
              <input
                type="text"
                value={newNameColumn}
                onChange={(e) => setNewNameColumn(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Participant ID Prefix</label>
              <input
                type="text"
                value={newParticipantPrefix}
                onChange={(e) => setNewParticipantPrefix(e.target.value)}
                placeholder="REG-2026-"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Confirmation Subject</label>
              <input
                type="text"
                value={newSubjectTemplate}
                onChange={(e) => setNewSubjectTemplate(e.target.value)}
                placeholder="Confirmed: {event} Registration — ID {participant_id}"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <label className="text-slate-700 font-medium">
                Confirmation Email Message Body (HTML)
              </label>
              <div className="flex gap-2">
                {MESSAGE_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setNewSubjectTemplate(p.subject);
                      setNewBodyTemplate(p.body);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                  >
                    Preset: {p.name}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={newBodyTemplate}
              onChange={(e) => setNewBodyTemplate(e.target.value)}
              rows={6}
              className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              onClick={() => setActiveTab('list')}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-2xs transition cursor-pointer"
            >
              Create Trigger &amp; Generate Code
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: GUIDE */}
      {activeTab === 'guide' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-xs text-slate-700">
          <div>
            <h3 className="font-semibold text-base text-slate-900">How to Attach the Trigger in 4 Simple Steps</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Takes less than 60 seconds with zero coding experience needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center">1</span>
              <p className="font-semibold text-slate-900 text-xs">Open Linked Sheet</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                In your Google Form, click the <strong>Responses</strong> tab and click <strong>Link to Sheets</strong> to open your response spreadsheet.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center">2</span>
              <p className="font-semibold text-slate-900 text-xs">Open Apps Script</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                In the Google Sheet top menu, select <strong>Extensions &gt; Apps Script</strong>.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center">3</span>
              <p className="font-semibold text-slate-900 text-xs">Paste &amp; Save</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Delete any sample code in <code>Code.gs</code>, paste the generated script from Let's Mail, and click the <strong>Save (Floppy Disk)</strong> icon.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center">4</span>
              <p className="font-semibold text-slate-900 text-xs">Add Submit Trigger</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                On the left sidebar, click <strong>Triggers (Alarm Clock icon) &gt; + Add Trigger</strong>. Under "Select event type", choose <strong>On form submit</strong> and click Save!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
