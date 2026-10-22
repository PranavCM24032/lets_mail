/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  initAuth,
  googleSignIn,
  logout,
  switchMockOrganizer
} from './services/auth';
import {
  OrganizerUser,
  Campaign,
  Recipient,
  GoogleFormAutomation,
  DailyQuotaUsage,
  RecipientDeliveryLog,
  NavigationTab
} from './types';
import { OrganizerStorage } from './services/storage';
import { renderTemplate } from './services/templateEngine';
import { executeBulkCampaignSending } from './services/gmail';
import { TopHeader } from './components/TopHeader';
import { SignInView } from './components/SignInView';
import { BulkEmailView } from './components/BulkEmailView';
import { FormAutomationView } from './components/FormAutomationView';
import { BulkSendingModal } from './components/BulkSendingModal';

export default function App() {
  // --- Auth State ---
  const [organizer, setOrganizer] = useState<OrganizerUser | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // --- Active Navigation: Only the 2 Core Requested Tabs ---
  const [currentTab, setCurrentTab] = useState<NavigationTab>('bulk-email');

  // --- Organizer Workspace Data ---
  const [storage, setStorage] = useState<OrganizerStorage | null>(null);
  const [quota, setQuota] = useState<DailyQuotaUsage>({
    dateKey: '',
    organizerUid: '',
    gmailAccount: '',
    sentCount: 0,
    failedCount: 0,
    hourlyBreakdown: {},
    capLimit: 500,
    lastUpdated: new Date().toISOString()
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [formAutomations, setFormAutomations] = useState<GoogleFormAutomation[]>([]);

  // --- Bulk Dispatch Modal State ---
  const [isBulkSendingModalOpen, setIsBulkSendingModalOpen] = useState(false);
  const [activeSendingCampaignName, setActiveSendingCampaignName] = useState('');
  const [activeBatchTotal, setActiveBatchTotal] = useState(0);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [activeBatchSent, setActiveBatchSent] = useState(0);
  const [activeBatchFailed, setActiveBatchFailed] = useState(0);
  const [activeBatchCurrentEmail, setActiveBatchCurrentEmail] = useState('');
  const [activeBatchLogs, setActiveBatchLogs] = useState<RecipientDeliveryLog[]>([]);
  const [isBatchCompleted, setIsBatchCompleted] = useState(false);
  const [isBatchPaused, setIsBatchPaused] = useState(false);
  const [isBatchCancelled, setIsBatchCancelled] = useState(false);

  // Control refs for non-stale pause / cancel signals
  const pauseRef = useRef(false);
  const cancelRef = useRef(false);

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        const savedWebhook = localStorage.getItem(`letsmail_webhook_${user.uid}`) || undefined;
        setOrganizer({ ...user, dispatcherWebhookUrl: savedWebhook });
        setAccessToken(token);
        setIsLoadingAuth(false);
      },
      () => {
        setOrganizer(null);
        setAccessToken('');
        setIsLoadingAuth(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // 2. Initialize Organizer Storage when Organizer changes
  useEffect(() => {
    if (!organizer) {
      setStorage(null);
      return;
    }

    const orgStorage = new OrganizerStorage(organizer.uid, organizer.email);
    setStorage(orgStorage);

    // Load workspace data
    const todayQuota = orgStorage.getTodayQuota();
    setQuota(todayQuota);

    const loadedCampaigns = orgStorage.getCampaigns();
    setCampaigns(loadedCampaigns);

    const loadedAutomations = orgStorage.getFormAutomations();
    // Seed default automation if empty for immediate exploration
    if (loadedAutomations.length === 0) {
      const defaultAuto: GoogleFormAutomation = {
        id: `form_default_${organizer.uid.slice(0, 8)}`,
        organizerUid: organizer.uid,
        formName: 'Spring Tech Fest 2026 Registration',
        eventName: 'Annual College Tech Fest 2026',
        emailColumn: 'Email Address',
        nameColumn: 'Full Name',
        participantIdPrefix: 'REG-TF-',
        subject: 'Confirmed: {event} Registration — ID {participant_id}',
        templateBody: `<p>Dear <strong>{name}</strong>,</p>
<p>Your registration for <strong>{event}</strong> has been successfully recorded in our event sheet!</p>
<p>Your official attendee ID is: <strong style="color: #4f46e5; font-family: monospace;">{participant_id}</strong></p>
<p>See you at the campus auditorium!</p>`,
        enabled: true,
        createdAt: new Date().toISOString(),
        totalSent: 12,
        recentLogs: [
          {
            id: 'log_seed_1',
            studentEmail: 'rohan.deshmukh@sbjit.edu.in',
            studentName: 'Rohan Deshmukh',
            participantId: 'REG-TF-1082',
            timestamp: '10:14 AM',
            status: 'success'
          },
          {
            id: 'log_seed_2',
            studentEmail: 'ananya.joshi@sbjit.edu.in',
            studentName: 'Ananya Joshi',
            participantId: 'REG-TF-1083',
            timestamp: '11:02 AM',
            status: 'success'
          }
        ]
      };
      orgStorage.saveFormAutomation(defaultAuto);
      setFormAutomations([defaultAuto]);
    } else {
      setFormAutomations(loadedAutomations);
    }
  }, [organizer]);

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async (): Promise<string | null> => {
    setIsLoadingAuth(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setOrganizer(result.user);
        setAccessToken(result.accessToken);
        return result.accessToken;
      }
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
    return null;
  };

  const handleUpdateWebhook = (url: string) => {
    if (!organizer) return;
    if (url) {
      localStorage.setItem(`letsmail_webhook_${organizer.uid}`, url);
    } else {
      localStorage.removeItem(`letsmail_webhook_${organizer.uid}`);
    }
    setOrganizer((prev) => (prev ? { ...prev, dispatcherWebhookUrl: url || undefined } : null));
  };

  const handleLogout = async () => {
    await logout();
    setOrganizer(null);
    setAccessToken('');
    setCurrentTab('bulk-email');
  };

  // Bulk Email Dispatch Execution
  const handleStartBulkSending = async (campaignData: {
    name: string;
    subject: string;
    bodyHtml: string;
    recipients: Recipient[];
  }) => {
    if (!organizer || !storage) return;

    // Check token availability
    let activeToken = accessToken || sessionStorage.getItem('letsmail_gmail_oauth_token') || '';
    // Only the built-in mock organizers are simulated. A real signed-in user
    // (including college addresses like @sbjit.edu) always sends for real.
    const isSimulatedAccount = organizer.uid.startsWith('org_');

    if (!activeToken && !organizer.dispatcherWebhookUrl) {
      if (isSimulatedAccount) {
        activeToken = 'simulated_oauth_token_' + organizer.uid;
        setAccessToken(activeToken);
      } else {
        try {
          const fresh = await handleGoogleSignIn();
          if (fresh) {
            activeToken = fresh;
          } else {
            return;
          }
        } catch {
          return;
        }
      }
    }

    const totalToProcess = campaignData.recipients.length;
    setActiveSendingCampaignName(campaignData.name);
    setActiveBatchTotal(totalToProcess);
    setActiveBatchIndex(0);
    setActiveBatchSent(0);
    setActiveBatchFailed(0);
    setActiveBatchLogs([]);
    setIsBatchCompleted(false);
    setIsBatchPaused(false);
    setIsBatchCancelled(false);
    setIsBulkSendingModalOpen(true);

    pauseRef.current = false;
    cancelRef.current = false;

    // Execute bulk dispatch engine
    const result = await executeBulkCampaignSending({
      recipients: campaignData.recipients,
      fromEmail: organizer.email,
      fromName: organizer.displayName,
      subjectTemplate: campaignData.subject,
      bodyTemplate: campaignData.bodyHtml,
      accessToken: activeToken,
      dispatcherWebhookUrl: organizer.dispatcherWebhookUrl,
      renderContent: renderTemplate,
      onProgress: (p) => {
        setActiveBatchIndex(p.currentIndex);
        setActiveBatchSent(p.sentCount);
        setActiveBatchFailed(p.failedCount);
        setActiveBatchCurrentEmail(p.currentRecipient.email);
        setActiveBatchLogs((prev) => [...prev, p.lastLog]);
      },
      shouldPause: () => pauseRef.current,
      shouldCancel: () => cancelRef.current,
      throttleMs: 650
    });

    setIsBatchCompleted(result.completed);
    setIsBatchCancelled(result.cancelled);

    // Record quota consumption
    const updatedQuota = storage.recordSentEmails(result.sentCount, result.failedCount);
    setQuota(updatedQuota);

    // Save campaign record to history
    const newCampaign: Campaign = {
      id: `camp_${Date.now()}`,
      organizerUid: organizer.uid,
      name: campaignData.name,
      subject: campaignData.subject,
      bodyHtml: campaignData.bodyHtml,
      recipients: campaignData.recipients,
      createdAt: new Date().toISOString(),
      status: result.completed ? 'completed' : 'cancelled',
      totalCount: totalToProcess,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      deliveryLogs: result.logs,
      completedAt: new Date().toISOString()
    };

    storage.saveCampaign(newCampaign);
    setCampaigns(storage.getCampaigns());
  };

  // If not logged in, render SignIn page
  if (!organizer && !isLoadingAuth) {
    return (
      <SignInView
        onGoogleSignIn={handleGoogleSignIn}
        isLoading={isLoadingAuth}
        onSelectMockOrganizer={(mockUser) => {
          const res = switchMockOrganizer(mockUser);
          setOrganizer(res.user);
          setAccessToken(res.token || '');
          setCurrentTab('bulk-email');
        }}
      />
    );
  }

  // Loading state
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center text-slate-700 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Connecting Let's Mail workspace...</p>
      </div>
    );
  }

  const remainingAllowance = Math.max(0, quota.capLimit - quota.sentCount);

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white antialiased">
      {/* Clean Top Navigation Bar with the Two Core Tabs */}
      <TopHeader
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        organizer={organizer!}
        accessToken={accessToken}
        quotaRemaining={remainingAllowance}
        quotaLimit={quota.capLimit}
        onLogout={handleLogout}
        onReauthorize={handleGoogleSignIn}
        onUpdateWebhook={handleUpdateWebhook}
      />

      {/* Main View Area: Only the Selected Tool */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
        {currentTab === 'bulk-email' && (
          <BulkEmailView
            organizer={organizer!}
            accessToken={accessToken}
            quotaRemaining={remainingAllowance}
            campaigns={campaigns}
            onDeleteCampaign={(id) => {
              if (storage) {
                storage.deleteCampaign(id);
                setCampaigns(storage.getCampaigns());
              }
            }}
            onDispatchCampaign={handleStartBulkSending}
            onReauthorize={handleGoogleSignIn}
          />
        )}

        {currentTab === 'form-automation' && (
          <FormAutomationView
            organizer={organizer!}
            automations={formAutomations}
            onSaveAutomation={(auto) => {
              if (storage) {
                storage.saveFormAutomation(auto);
                setFormAutomations(storage.getFormAutomations());
              }
            }}
            onDeleteAutomation={(id) => {
              if (storage) {
                storage.deleteFormAutomation(id);
                setFormAutomations(storage.getFormAutomations());
              }
            }}
          />
        )}
      </main>

      {/* Live Bulk Sending Execution Modal */}
      <BulkSendingModal
        isOpen={isBulkSendingModalOpen}
        campaignName={activeSendingCampaignName}
        totalRecipients={activeBatchTotal}
        currentIndex={activeBatchIndex}
        sentCount={activeBatchSent}
        failedCount={activeBatchFailed}
        currentEmail={activeBatchCurrentEmail}
        logs={activeBatchLogs}
        isCompleted={isBatchCompleted}
        isPaused={isBatchPaused}
        isCancelled={isBatchCancelled}
        onPauseToggle={() => {
          pauseRef.current = !pauseRef.current;
          setIsBatchPaused(pauseRef.current);
        }}
        onCancel={() => {
          cancelRef.current = true;
          setIsBatchCancelled(true);
        }}
        onClose={() => setIsBulkSendingModalOpen(false)}
        onViewHistory={() => {
          setIsBulkSendingModalOpen(false);
          setCurrentTab('bulk-email');
        }}
      />
    </div>
  );
}
