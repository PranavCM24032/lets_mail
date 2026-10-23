import { EmailTemplate, Recipient } from '../types';

const RESPONSIVE_EMAIL_STYLES = `
  <style>
    @media only screen and (max-width: 600px) {
      .email-outer { padding: 12px 8px !important; }
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 12px !important; }
      .email-header { padding: 24px 18px !important; }
      .email-content { padding: 22px 18px !important; }
      .email-footer { padding: 16px 18px !important; }
      .email-title { font-size: 21px !important; line-height: 1.3 !important; }
      .email-subtitle { font-size: 13px !important; }
      .email-badge { padding: 14px !important; }
      .email-detail-label,
      .email-detail-value { display: block !important; width: 100% !important; text-align: left !important; }
      .email-detail-label { padding-bottom: 2px !important; }
      .email-detail-value { padding-bottom: 12px !important; }
      .email-button { display: block !important; width: 100% !important; padding: 13px 16px !important; box-sizing: border-box !important; text-align: center !important; }
      .email-list { padding-left: 18px !important; font-size: 13px !important; }
      .email-certificate-card { padding: 26px 18px !important; }
      .email-certificate-title { font-size: 20px !important; letter-spacing: 0.04em !important; }
      .email-certificate-name { font-size: 23px !important; }
      .email-minimal { padding: 24px 16px !important; }
    }
  </style>`;

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'event-pass',
    name: 'Event Pass & Ticket Confirmation',
    category: 'ticket',
    description: 'Modern event pass with registration badge, participant ID, venue details, and check-in button.',
    defaultSubject: 'Your Pass for ${event} — ID: ${participant_id}',
    availableTags: ['${name}', '${event}', '${participant_id}', '${login_link}'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">${RESPONSIVE_EMAIL_STYLES}
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-outer" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" class="email-card" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <tr>
            <td class="email-header" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 28px; text-align: center;">
              <span style="display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.2); border-radius: 9999px; color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Official Event Entry Pass</span>
              <h1 class="email-title" style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; line-height: 1.3;">\${event}</h1>
              <p class="email-subtitle" style="margin: 8px 0 0; color: #dbeafe; font-size: 14px;">Organized by Campus Event Committee</p>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td class="email-content" style="padding: 28px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">Dear <strong>\${name}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
                Congratulations! Your registration for <strong>\${event}</strong> has been confirmed. Please present this email or your Participant ID at the registration desk for seamless check-in.
              </p>
              
              <!-- Badge Card -->
              <table role="presentation" width="100%" class="email-badge" style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%">
                      <tr>
                        <td class="email-detail-label" style="font-size: 13px; color: #64748b; padding-bottom: 6px;">Participant Name:</td>
                        <td align="right" class="email-detail-value" style="font-size: 14px; font-weight: 600; color: #0f172a; padding-bottom: 6px;">\${name}</td>
                      </tr>
                      <tr>
                        <td class="email-detail-label" style="font-size: 13px; color: #64748b; padding-bottom: 6px;">Participant ID:</td>
                        <td align="right" class="email-detail-value" style="font-size: 14px; font-weight: 700; color: #2563eb; font-family: monospace; padding-bottom: 6px;">\${participant_id}</td>
                      </tr>
                      <tr>
                        <td class="email-detail-label" style="font-size: 13px; color: #64748b;">Event Track:</td>
                        <td align="right" class="email-detail-value" style="font-size: 14px; font-weight: 600; color: #0f172a;">\${event}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="\${login_link}" class="email-button" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.25);">
                  View Event Dashboard &amp; Schedule
                </a>
              </div>

              <p style="margin: 20px 0 0; font-size: 13px; color: #64748b; text-align: center; line-height: 1.5;">
                Or copy your check-in link: <br />
                <span style="font-family: monospace; font-size: 12px; color: #2563eb; word-break: break-all;">\${login_link}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.4;">
                Sent via <strong>Let's Mail</strong> &bull; Direct Google Account Dispatch<br />
                If you did not register for this event, please disregard this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'hackathon-guide',
    name: 'Hackathon & Workshop Orientation',
    category: 'reminder',
    description: 'Technical guidance, orientation schedule, room links, and mentor contacts.',
    defaultSubject: 'Important Guidelines & Access for ${event}',
    availableTags: ['${name}', '${event}', '${participant_id}', '${login_link}'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">${RESPONSIVE_EMAIL_STYLES}
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-outer" style="background-color: #0f172a; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" class="email-card" style="max-width: 580px; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
          <tr>
            <td class="email-header" style="padding: 32px 28px; border-bottom: 1px solid #334155;">
              <span style="color: #38bdf8; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">Participant Briefing</span>
              <h1 class="email-title" style="margin: 8px 0 0; color: #ffffff; font-size: 24px; font-weight: 700;">\${event}</h1>
            </td>
          </tr>
          <tr>
            <td class="email-content" style="padding: 28px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #e2e8f0; line-height: 1.6;">
                Hi <strong>\${name}</strong>, we are thrilled to welcome you to <strong>\${event}</strong>.
              </p>
              <div class="email-badge" style="background-color: #0f172a; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #334155;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #94a3b8;">Your Assigned Identification:</p>
                <p style="margin: 0; font-family: monospace; font-size: 18px; color: #38bdf8; font-weight: 700;">\${participant_id}</p>
              </div>
              <h3 style="margin: 24px 0 12px; color: #ffffff; font-size: 16px;">Key Event Highlights:</h3>
              <ul class="email-list" style="margin: 0 0 20px; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                <li>Check-in opens 45 minutes prior to kickoff</li>
                <li>Bring a valid college student ID card and your laptop</li>
                <li>Wi-Fi credentials will be distributed in the opening keynote</li>
              </ul>
              <div style="text-align: center; margin: 32px 0 16px;">
                <a href="\${login_link}" class="email-button" style="background-color: #38bdf8; color: #0f172a; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">
                  Open Participant Workspace
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td class="email-footer" style="background-color: #0f172a; padding: 16px 28px; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Let's Mail Platform &bull; College Event Organizer Dispatch
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'certificate-announcement',
    name: 'Certificate of Participation',
    category: 'certificate',
    description: 'Gold-accented congratulatory certificate delivery with verification ID.',
    defaultSubject: 'Certificate of Participation: ${event} for ${name}',
    availableTags: ['${name}', '${event}', '${participant_id}', '${login_link}'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">${RESPONSIVE_EMAIL_STYLES}
</head>
<body style="margin: 0; padding: 0; background-color: #fbfbfa; font-family: Georgia, 'Times New Roman', serif; color: #2d3748;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-outer" style="background-color: #fbfbfa; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" class="email-card email-certificate-card" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 2px solid #d4af37; padding: 36px 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <tr>
            <td align="center">
              <span style="font-size: 32px; color: #d4af37; display: block; margin-bottom: 8px;">★ ★ ★</span>
              <h1 class="email-certificate-title" style="margin: 0; font-size: 26px; color: #1a202c; text-transform: uppercase; letter-spacing: 0.08em;">Certificate of Participation</h1>
              <p style="margin: 8px 0 24px; font-size: 14px; color: #718096; font-style: italic;">This is proudly presented to</p>
              
              <h2 class="email-certificate-name" style="margin: 0 0 16px; font-size: 28px; color: #2b6cb0; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; display: inline-block;">\${name}</h2>
              
              <p style="margin: 16px 0; font-size: 15px; line-height: 1.7; color: #4a5568;">
                for their active and dedicated participation in <strong>\${event}</strong>. We commend your enthusiasm, innovation, and pursuit of academic excellence.
              </p>

              <div class="email-badge" style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 24px 0; font-family: monospace; font-size: 13px; color: #4a5568;">
                Verification Record ID: <strong>\${participant_id}</strong>
              </div>

              <div style="margin: 28px 0 8px;">
                <a href="\${login_link}" class="email-button" style="background-color: #2b6cb0; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-family: -apple-system, sans-serif; font-size: 14px; font-weight: 600;">
                  Download High-Resolution PDF
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'clean-announcement',
    name: 'Clean Minimalist Notice',
    category: 'simple',
    description: 'Crisp, lightweight email optimized for high deliverability and fast reading on phones.',
    defaultSubject: 'Update regarding ${event}',
    availableTags: ['${name}', '${event}', '${participant_id}', '${login_link}'],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">${RESPONSIVE_EMAIL_STYLES}
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.6;">
  <div class="email-minimal" style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">
    <p style="font-size: 16px; margin: 0 0 16px;">Hello \${name},</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 16px;">
      This is an important update regarding your participation in <strong>\${event}</strong> (Participant ID: <code>\${participant_id}</code>).
    </p>
    <div style="border-left: 3px solid #3b82f6; padding-left: 16px; margin: 20px 0; color: #1f2937;">
      <p style="margin: 0; font-size: 15px;">
        Please make sure to review your details and confirm attendance through your link:
      </p>
      <p style="margin: 8px 0 0;">
        <a href="\${login_link}" style="color: #2563eb; font-weight: 600; text-decoration: underline; word-break: break-all;">\${login_link}</a>
      </p>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin: 24px 0 0;">
      Warm regards,<br />
      <strong>Event Organizing Team</strong>
    </p>
  </div>
</body>
</html>`
  }
];

const normalizeFieldKey = (value: string) =>
  value.trim().toLowerCase().replace(/[\s-]+/g, '_');

const FIELD_ALIASES: Record<string, string[]> = {
  participant_id: ['participant_id', 'participantid', 'id'],
  participantid: ['participant_id', 'participantid', 'id'],
  id: ['participant_id', 'participantid', 'id'],
  event: ['event', 'event_name'],
  event_name: ['event', 'event_name'],
  login: ['login', 'login_link', 'link', 'url'],
  login_link: ['login', 'login_link', 'link', 'url'],
  link: ['login', 'login_link', 'link', 'url'],
  url: ['login', 'login_link', 'link', 'url']
};

const getFieldAliases = (key: string): string[] => {
  const normalized = normalizeFieldKey(key);
  return FIELD_ALIASES[normalized] || [normalized];
};

// Built-in fields get sensible defaults even without a matching spreadsheet
// column, so they must be validated against the recipient data explicitly.
const FALLBACK_MERGE_FIELDS = [
  'event',
  'event_name',
  'participant_id',
  'participantid',
  'id',
  'login',
  'login_link',
  'link',
  'url'
];

export function isFallbackMergeField(key: string): boolean {
  return FALLBACK_MERGE_FIELDS.includes(normalizeFieldKey(key));
}

/**
 * Returns the unique `${attribute}` names used in a template. Any spreadsheet
 * column name is supported, so newly added columns work without code changes.
 */
export function extractMergeFields(templateString: string): string[] {
  const matches = templateString.match(/\$\{[^{}]+\}/g) || [];
  return Array.from(
    new Set(matches.map((token) => token.slice(2, -1).trim()).filter(Boolean))
  );
}

export function hasRecipientDataField(recipient: Recipient, key: string): boolean {
  if (normalizeFieldKey(key) === 'name' && recipient.name) return true;
  if (normalizeFieldKey(key) === 'email' && recipient.email) return true;
  const aliases = getFieldAliases(key);
  return Object.entries(recipient.data).some(
    ([dataKey, value]) => value !== '' && aliases.includes(normalizeFieldKey(dataKey))
  );
}

/**
 * Replaces placeholders in text with recipient specific data.
 * Supports:
 * - ${name}
 * - ${event}
 * - ${participant_id}
 * - ${login_link}
 * - any custom column in lowercase or original casing
 */
export function renderTemplate(templateString: string, recipient: Recipient): string {
  if (!templateString) return '';

  const dataKeys = Object.keys(recipient.data);
  const findDataValue = (keys: string[]): string | undefined => {
    const wanted = keys.map(normalizeFieldKey);
    for (const key of keys) {
      if (recipient.data[key] !== undefined && recipient.data[key] !== '') {
        return recipient.data[key];
      }
    }
    const matchedKey = dataKeys.find((candidate) =>
      wanted.includes(normalizeFieldKey(candidate))
    );
    if (matchedKey && recipient.data[matchedKey] !== '') {
      return recipient.data[matchedKey];
    }
    return undefined;
  };

  return templateString.replace(/\$\{([^{}]+)\}/g, (match, rawKey) => {
    const key = rawKey.trim();
    const keyLower = normalizeFieldKey(key);

    // Direct mappings
    if (keyLower === 'name' && recipient.name) {
      return recipient.name;
    }
    if (keyLower === 'email') {
      return recipient.email;
    }

    // Check in recipient data (case-insensitive against the uploaded column headers)
    const directValue = findDataValue([key, keyLower]);
    if (directValue !== undefined) {
      return directValue;
    }

    // Common aliases
    if (keyLower === 'participant_id' || keyLower === 'participantid' || keyLower === 'id') {
      return (
        findDataValue(getFieldAliases(keyLower)) ||
        'PARTICIPANT-' + recipient.id.slice(-4).toUpperCase()
      );
    }
    if (keyLower === 'event' || keyLower === 'event_name') {
      return findDataValue(getFieldAliases(keyLower)) || 'College Event';
    }
    if (
      keyLower === 'login' ||
      keyLower === 'login_link' ||
      keyLower === 'link' ||
      keyLower === 'url'
    ) {
      return findDataValue(getFieldAliases(keyLower)) || '#';
    }

    // Return the placeholder intact if no value found
    return match;
  });
}

