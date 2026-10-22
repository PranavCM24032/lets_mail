import { Campaign, DailyQuotaUsage, GoogleFormAutomation, ScheduledJob } from '../types';

const PREFIX = 'letsmail_v1_';

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export class OrganizerStorage {
  private uid: string;
  private userEmail: string;

  constructor(uid: string, userEmail: string) {
    this.uid = uid;
    this.userEmail = userEmail;
  }

  private getKey(category: string): string {
    return `${PREFIX}${this.uid}_${category}`;
  }

  // --- Daily Quota Management ---
  public getTodayQuota(): DailyQuotaUsage {
    const today = getTodayKey();
    const raw = localStorage.getItem(this.getKey('quota_' + today));
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }

    const defaultUsage: DailyQuotaUsage = {
      dateKey: today,
      organizerUid: this.uid,
      gmailAccount: this.userEmail,
      sentCount: 0,
      failedCount: 0,
      hourlyBreakdown: {},
      capLimit: 500, // Google consumer Gmail daily limit
      lastUpdated: new Date().toISOString()
    };
    this.saveTodayQuota(defaultUsage);
    return defaultUsage;
  }

  public saveTodayQuota(usage: DailyQuotaUsage): void {
    const today = getTodayKey();
    localStorage.setItem(this.getKey('quota_' + today), JSON.stringify(usage));
  }

  public recordSentEmails(count: number, failures: number = 0): DailyQuotaUsage {
    const usage = this.getTodayQuota();
    const currentHour = new Date().getHours();
    usage.sentCount += count;
    usage.failedCount += failures;
    usage.hourlyBreakdown[currentHour] = (usage.hourlyBreakdown[currentHour] || 0) + count;
    usage.lastUpdated = new Date().toISOString();
    this.saveTodayQuota(usage);
    return usage;
  }

  public getRemainingDailyQuota(): number {
    const usage = this.getTodayQuota();
    return Math.max(0, usage.capLimit - usage.sentCount);
  }

  // --- Campaigns Management ---
  public getCampaigns(): Campaign[] {
    const raw = localStorage.getItem(this.getKey('campaigns'));
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveCampaign(campaign: Campaign): void {
    const campaigns = this.getCampaigns();
    const index = campaigns.findIndex((c) => c.id === campaign.id);
    if (index >= 0) {
      campaigns[index] = campaign;
    } else {
      campaigns.unshift(campaign);
    }
    localStorage.setItem(this.getKey('campaigns'), JSON.stringify(campaigns));
  }

  public deleteCampaign(id: string): void {
    const campaigns = this.getCampaigns().filter((c) => c.id !== id);
    localStorage.setItem(this.getKey('campaigns'), JSON.stringify(campaigns));
  }

  // --- Google Form Automations Management ---
  public getFormAutomations(): GoogleFormAutomation[] {
    const raw = localStorage.getItem(this.getKey('form_automations'));
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveFormAutomation(automation: GoogleFormAutomation): void {
    const list = this.getFormAutomations();
    const index = list.findIndex((a) => a.id === automation.id);
    if (index >= 0) {
      list[index] = automation;
    } else {
      list.unshift(automation);
    }
    localStorage.setItem(this.getKey('form_automations'), JSON.stringify(list));
  }

  public deleteFormAutomation(id: string): void {
    const list = this.getFormAutomations().filter((a) => a.id !== id);
    localStorage.setItem(this.getKey('form_automations'), JSON.stringify(list));
  }

  // --- Scheduled Jobs Management ---
  public getScheduledJobs(): ScheduledJob[] {
    const raw = localStorage.getItem(this.getKey('scheduled_jobs'));
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveScheduledJob(job: ScheduledJob): void {
    const list = this.getScheduledJobs();
    const index = list.findIndex((j) => j.id === job.id);
    if (index >= 0) {
      list[index] = job;
    } else {
      list.unshift(job);
    }
    localStorage.setItem(this.getKey('scheduled_jobs'), JSON.stringify(list));
  }

  public deleteScheduledJob(id: string): void {
    const list = this.getScheduledJobs().filter((j) => j.id !== id);
    localStorage.setItem(this.getKey('scheduled_jobs'), JSON.stringify(list));
  }

  // --- Wipe this organizer's workspace ---
  public clearAllData(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${PREFIX}${this.uid}_`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}
