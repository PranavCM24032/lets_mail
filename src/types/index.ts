export interface OrganizerUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  dispatcherWebhookUrl?: string;
  connectionMethod?: 'oauth' | 'apps_script_webhook' | 'demo';
}

export interface Recipient {
  id: string;
  email: string;
  name?: string;
  data: Record<string, string>;
  isValid: boolean;
  validationError?: string;
  isDuplicate?: boolean;
}

export type NavigationTab =
  | 'bulk-email'
  | 'form-automation'
  | 'overview'
  | 'campaigns'
  | 'create-campaign'
  | 'scheduled'
  | 'contacts'
  | 'activity'
  | 'settings';

export type CampaignStatus = 'draft' | 'sending' | 'completed' | 'paused' | 'cancelled' | 'scheduled';

export interface RecipientDeliveryLog {
  recipientId: string;
  email: string;
  name: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  timestamp?: string;
  error?: string;
  messageId?: string;
}

export interface Campaign {
  id: string;
  organizerUid: string;
  name: string;
  subject: string;
  bodyHtml: string;
  templateId?: string;
  recipients: Recipient[];
  createdAt: string;
  status: CampaignStatus;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  deliveryLogs: RecipientDeliveryLog[];
  completedAt?: string;
  scheduledFor?: string;
}

export interface GoogleFormAutomation {
  id: string;
  organizerUid: string;
  formName: string;
  eventName: string;
  emailColumn: string;
  nameColumn: string;
  participantIdPrefix: string;
  subject: string;
  templateBody: string;
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
  totalSent: number;
  recentLogs: Array<{
    id: string;
    studentEmail: string;
    studentName: string;
    participantId: string;
    timestamp: string;
    status: 'success' | 'error';
    details?: string;
  }>;
}

export interface DailyQuotaUsage {
  dateKey: string; // YYYY-MM-DD
  organizerUid: string;
  gmailAccount: string;
  sentCount: number;
  failedCount: number;
  hourlyBreakdown: Record<number, number>; // hour 0-23 -> count
  capLimit: number; // 500 for standard Gmail
  lastUpdated: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'event' | 'ticket' | 'certificate' | 'reminder' | 'newsletter' | 'simple';
  description: string;
  defaultSubject: string;
  htmlContent: string;
  availableTags: string[];
}
