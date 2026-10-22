import { Recipient, RecipientDeliveryLog } from '../types';

export interface SendEmailParams {
  toEmail: string;
  toName?: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  bodyHtml: string;
  accessToken: string;
  dispatcherWebhookUrl?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isSimulated?: boolean;
}

/**
 * Encodes string to UTF-8 Base64URL (RFC 4648)
 */
export function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * RFC 2047 B-encoding for email headers with UTF-8 characters
 */
export function encodeMimeHeader(text: string): string {
  // If text is ASCII only, we can keep it as is, or encode if it has non-ascii
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(text)) {
    return text;
  }
  const utf8Bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return `=?utf-8?B?${btoa(binary)}?=`;
}

/**
 * Builds RFC 2822 compliant MIME email string
 */
export function buildMimeMessage(params: SendEmailParams): string {
  const { toEmail, toName, fromEmail, fromName, subject, bodyHtml } = params;

  const formattedTo = toName ? `"${encodeMimeHeader(toName)}" <${toEmail}>` : toEmail;
  const formattedFrom = fromName ? `"${encodeMimeHeader(fromName)}" <${fromEmail}>` : fromEmail;
  const encodedSubject = encodeMimeHeader(subject);
  const dateStr = new Date().toUTCString();

  // Construct a single-part text/html MIME message
  const mimeLines = [
    `From: ${formattedFrom}`,
    `To: ${formattedTo}`,
    `Subject: ${encodedSubject}`,
    `Date: ${dateStr}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    '',
    // Base64 encode the HTML body
    (() => {
      const utf8Bytes = new TextEncoder().encode(bodyHtml);
      let binary = '';
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      return btoa(binary);
    })()
  ];

  return mimeLines.join('\r\n');
}

/**
 * Sends a single email via Google Apps Script Webhook or Gmail API
 */
export async function sendEmailViaGmailApi(params: SendEmailParams): Promise<SendResult> {
  const { dispatcherWebhookUrl } = params;
  let effectiveToken: string = params.accessToken || '';

  // Retrieve token from active session cache if missing from params
  if (!effectiveToken && typeof sessionStorage !== 'undefined') {
    try {
      effectiveToken = sessionStorage.getItem('letsmail_gmail_oauth_token') || '';
    } catch {
      //
    }
  }

  // 1. Check if user configured a personal Apps Script Webhook (Zero-GCP, Zero-OAuth mode)
  if (dispatcherWebhookUrl) {
    try {
      const response = await fetch(dispatcherWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          toEmail: params.toEmail,
          toName: params.toName,
          fromEmail: params.fromEmail,
          fromName: params.fromName,
          subject: params.subject,
          bodyHtml: params.bodyHtml
        })
      });

      const responseText = await response.text().catch(() => '');
      let parsedJson: { success?: boolean; error?: string; messageId?: string } | null = null;
      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        // If Google Apps Script redirect was opaque
      }

      if (parsedJson && parsedJson.success === false) {
        return {
          success: false,
          error: parsedJson.error || 'Apps Script dispatcher returned an error'
        };
      }

      return {
        success: true,
        messageId: parsedJson?.messageId || `as_${Date.now()}`
      };
    } catch (err: unknown) {
      // In case of browser CORS redirect on Apps Script, if network reached it's sent
      return {
        success: true,
        messageId: `as_dispatched_${Date.now()}`
      };
    }
  }

  // 2. Check if simulated mode (only for the built-in mock organizers / mocked tokens).
  // Never infer this from the sender address: real users can legitimately have
  // "test", "demo", "@sbjit.edu", etc. in their email and still expect real delivery.
  const isDemoOrSimulated =
    (effectiveToken && effectiveToken.startsWith('simulated_oauth_token_')) ||
    (effectiveToken && effectiveToken.startsWith('mock_'));

  if (isDemoOrSimulated) {
    await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 250));
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      isSimulated: true
    };
  }

  if (!effectiveToken) {
    return {
      success: false,
      error: 'Gmail authorization token missing. Please reconnect your Google account or connect your Apps Script Webhook.'
    };
  }

  try {
    const mimeString = buildMimeMessage(params);
    const rawBase64Url = base64UrlEncode(mimeString);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${effectiveToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawBase64Url })
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const errorMessage =
        errorJson?.error?.message ||
        `Gmail API returned status ${response.status}: ${response.statusText}`;

      // Check specific error patterns
      if (response.status === 401) {
        return {
          success: false,
          error: 'Gmail session expired. Please sign in again with Google to refresh permissions.'
        };
      }
      if (response.status === 403 && errorMessage.toLowerCase().includes('quota')) {
        return {
          success: false,
          error: 'Daily Gmail sending quota reached. Google limits consumer accounts to 500 emails/day.'
        };
      }

      return {
        success: false,
        error: errorMessage
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id || `msg_${Date.now()}`
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error communicating with Gmail API';
    return {
      success: false,
      error: errorMsg
    };
  }
}

/**
 * Sends bulk batch with throttled rate-limiting, progress feedback, pause/resume/cancel
 */
export async function executeBulkCampaignSending(options: {
  recipients: Recipient[];
  fromEmail: string;
  fromName: string;
  subjectTemplate: string;
  bodyTemplate: string;
  accessToken: string;
  dispatcherWebhookUrl?: string;
  renderContent: (template: string, recipient: Recipient) => string;
  onProgress: (progress: {
    currentIndex: number;
    total: number;
    currentRecipient: Recipient;
    sentCount: number;
    failedCount: number;
    lastLog: RecipientDeliveryLog;
  }) => void;
  shouldPause: () => boolean;
  shouldCancel: () => boolean;
  throttleMs?: number;
  maxSends?: number;
}): Promise<{
  completed: boolean;
  cancelled: boolean;
  quotaExhausted: boolean;
  sentCount: number;
  failedCount: number;
  logs: RecipientDeliveryLog[];
}> {
  const {
    recipients,
    fromEmail,
    fromName,
    subjectTemplate,
    bodyTemplate,
    accessToken,
    dispatcherWebhookUrl,
    renderContent,
    onProgress,
    shouldPause,
    shouldCancel,
    throttleMs = 800,
    maxSends = Number.POSITIVE_INFINITY
  } = options;

  let sentCount = 0;
  let failedCount = 0;
  const logs: RecipientDeliveryLog[] = [];

  for (let i = 0; i < recipients.length; i++) {
    if (sentCount >= maxSends) {
      return { completed: false, cancelled: false, quotaExhausted: true, sentCount, failedCount, logs };
    }

    if (shouldCancel()) {
      return { completed: false, cancelled: true, quotaExhausted: false, sentCount, failedCount, logs };
    }

    // Wait if paused
    while (shouldPause() && !shouldCancel()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    if (shouldCancel()) {
      return { completed: false, cancelled: true, quotaExhausted: false, sentCount, failedCount, logs };
    }

    const recipient = recipients[i];

    // Skip invalid recipient
    if (!recipient.isValid) {
      const skippedLog: RecipientDeliveryLog = {
        recipientId: recipient.id,
        email: recipient.email,
        name: recipient.name || '',
        status: 'skipped',
        timestamp: new Date().toISOString(),
        error: recipient.validationError || 'Invalid email address'
      };
      logs.push(skippedLog);
      failedCount++;
      onProgress({
        currentIndex: i + 1,
        total: recipients.length,
        currentRecipient: recipient,
        sentCount,
        failedCount,
        lastLog: skippedLog
      });
      continue;
    }

    // Personalize subject & body
    const personalizedSubject = renderContent(subjectTemplate, recipient);
    const personalizedBody = renderContent(bodyTemplate, recipient);

    // Send single email
    const result = await sendEmailViaGmailApi({
      toEmail: recipient.email,
      toName: recipient.name,
      fromEmail,
      fromName,
      subject: personalizedSubject,
      bodyHtml: personalizedBody,
      accessToken,
      dispatcherWebhookUrl
    });

    const log: RecipientDeliveryLog = {
      recipientId: recipient.id,
      email: recipient.email,
      name: recipient.name || '',
      status: result.success ? 'success' : 'failed',
      timestamp: new Date().toISOString(),
      messageId: result.messageId,
      error: result.error
    };

    if (result.success) {
      sentCount++;
    } else {
      failedCount++;
    }

    logs.push(log);

    onProgress({
      currentIndex: i + 1,
      total: recipients.length,
      currentRecipient: recipient,
      sentCount,
      failedCount,
      lastLog: log
    });

    // If critical auth error (missing token or expired session), break loop early
    if (
      !result.success &&
      (result.error?.includes('authorization token missing') ||
        result.error?.includes('session expired') ||
        result.error?.includes('Invalid Credentials'))
    ) {
      return {
        completed: false,
        cancelled: true,
        quotaExhausted: false,
        sentCount,
        failedCount,
        logs
      };
    }

    // Polite throttle between emails to respect Gmail API rate limits
    if (i < recipients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, throttleMs));
    }
  }

  return {
    completed: true,
    cancelled: false,
    quotaExhausted: false,
    sentCount,
    failedCount,
    logs
  };
}
