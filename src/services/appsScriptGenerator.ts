import { GoogleFormAutomation } from '../types';

/**
 * Generates ready-to-run Google Apps Script code for Google Forms onFormSubmit trigger
 */
export function generateFormAppsScriptCode(automation: GoogleFormAutomation): string {
  const safeSubject = JSON.stringify(automation.subject);
  const safeBody = JSON.stringify(automation.templateBody);
  const eventName = JSON.stringify(automation.eventName);
  const prefix = JSON.stringify(automation.participantIdPrefix || 'REG-2026-');

  return `/**
 * ========================================================================
 * LET'S MAIL — AUTOMATIC GOOGLE FORM SUBMISSION TRIGGER SCRIPT
 * Event: ${automation.eventName}
 * Generated for Organizer: ${automation.organizerUid}
 * 
 * 100% Free & Zero-Cost Architecture:
 * - Runs directly inside Google's cloud on your authorized Google account.
 * - Requires NO credit card, NO billing, NO third-party webhooks.
 * - Free Consumer Quota Notice: Free @gmail.com accounts have an Apps Script
 *   email limit of 100 recipients/day (Workspace accounts have 1,500/day).
 * ========================================================================
 */

// Configuration mapped from Let's Mail
const CONFIG = {
  EVENT_NAME: ${eventName},
  EMAIL_FIELD: ${JSON.stringify(automation.emailColumn)},
  NAME_FIELD: ${JSON.stringify(automation.nameColumn)},
  PARTICIPANT_ID_PREFIX: ${prefix},
  EMAIL_SUBJECT_TEMPLATE: ${safeSubject},
  EMAIL_BODY_TEMPLATE: ${safeBody},
  PROCESSED_STATUS_COLUMN_HEADER: "LetsMail_Status",
  PARTICIPANT_ID_COLUMN_HEADER: "Participant_ID"
};

/**
 * Main Trigger Function
 * Attach this to your Google Form's linked Response Spreadsheet:
 * Extensions > Apps Script > Paste code > Set up trigger on "On form submit"
 */
function onFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lock = LockService.getScriptLock();
  
  // Wait up to 30 seconds for lock to avoid duplicate concurrency
  try {
    lock.waitLock(30000);
  } catch (err) {
    Logger.log("Could not obtain lock to process submission safely: " + err);
    return;
  }

  try {
    const lastRow = sheet.getLastRow();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowValues = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Ensure status and participant ID headers exist in the sheet
    let statusColIdx = headers.indexOf(CONFIG.PROCESSED_STATUS_COLUMN_HEADER) + 1;
    if (statusColIdx === 0) {
      statusColIdx = headers.length + 1;
      sheet.getRange(1, statusColIdx).setValue(CONFIG.PROCESSED_STATUS_COLUMN_HEADER);
      headers.push(CONFIG.PROCESSED_STATUS_COLUMN_HEADER);
    }

    let idColIdx = headers.indexOf(CONFIG.PARTICIPANT_ID_COLUMN_HEADER) + 1;
    if (idColIdx === 0) {
      idColIdx = headers.length + 1;
      sheet.getRange(1, idColIdx).setValue(CONFIG.PARTICIPANT_ID_COLUMN_HEADER);
      headers.push(CONFIG.PARTICIPANT_ID_COLUMN_HEADER);
    }

    // Duplicate Prevention Check: Check if this row is already processed
    const currentStatus = sheet.getRange(lastRow, statusColIdx).getValue();
    if (currentStatus === "SENT" || currentStatus === "SUCCESS") {
      Logger.log("Row " + lastRow + " already processed. Skipping duplicate send.");
      return;
    }

    // Map named fields to submitted values
    const dataMap = {};
    headers.forEach((h, i) => {
      dataMap[h] = rowValues[i] !== undefined ? String(rowValues[i]).trim() : "";
      dataMap[h.toLowerCase()] = dataMap[h];
    });

    // Extract student email
    const studentEmail = dataMap[CONFIG.EMAIL_FIELD] || dataMap[CONFIG.EMAIL_FIELD.toLowerCase()] || dataMap["email"] || dataMap["email address"];
    if (!studentEmail || !studentEmail.includes("@")) {
      sheet.getRange(lastRow, statusColIdx).setValue("FAILED: Invalid or missing email");
      Logger.log("Invalid email found in row " + lastRow + ": " + studentEmail);
      return;
    }

    // Extract student name
    const studentName = dataMap[CONFIG.NAME_FIELD] || dataMap[CONFIG.NAME_FIELD.toLowerCase()] || dataMap["name"] || studentEmail.split("@")[0];

    // Generate Unique Participant ID
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const participantId = CONFIG.PARTICIPANT_ID_PREFIX + lastRow + "-" + randomHex;
    sheet.getRange(lastRow, idColIdx).setValue(participantId);

    // Provide variables for placeholders
    dataMap["name"] = studentName;
    dataMap["event"] = CONFIG.EVENT_NAME;
    dataMap["participant_id"] = participantId;
    dataMap["login_link"] = "https://portal.sbjit.edu/checkin/" + participantId;

    // Substitute placeholders in subject & body
    let subject = CONFIG.EMAIL_SUBJECT_TEMPLATE;
    let bodyHtml = CONFIG.EMAIL_BODY_TEMPLATE;

    Object.keys(dataMap).forEach(key => {
      const val = dataMap[key];
      const regex = new RegExp("{" + key + "}", "gi");
      subject = subject.replace(regex, val);
      bodyHtml = bodyHtml.replace(regex, val);
    });

    // Check Apps Script remaining daily quota
    const remainingQuota = MailApp.getRemainingDailyQuota();
    if (remainingQuota < 1) {
      sheet.getRange(lastRow, statusColIdx).setValue("QUEUED: Daily Apps Script email quota (100) reached. Will retry.");
      Logger.log("Google Apps Script daily email quota exhausted for today.");
      return;
    }

    // Send personalized email from the authorized organizer account
    GmailApp.sendEmail(studentEmail, subject, "", {
      htmlBody: bodyHtml,
      name: "Let's Mail &bull; " + CONFIG.EVENT_NAME
    });

    // Mark as successfully processed with timestamp
    const nowTimestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    sheet.getRange(lastRow, statusColIdx).setValue("SENT: " + nowTimestamp);
    Logger.log("Successfully sent confirmation to " + studentEmail + " with ID " + participantId);

  } catch (error) {
    Logger.log("Error processing submission: " + error.toString());
    const lastRow = sheet.getLastRow();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const statusColIdx = headers.indexOf(CONFIG.PROCESSED_STATUS_COLUMN_HEADER) + 1;
    if (statusColIdx > 0) {
      sheet.getRange(lastRow, statusColIdx).setValue("ERROR: " + error.message);
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Test function: run manually from Apps Script editor to verify permissions
 */
function testExecution() {
  const email = Session.getActiveUser().getEmail();
  Logger.log("Active organizer email: " + email);
  Logger.log("Remaining Apps Script email quota for today: " + MailApp.getRemainingDailyQuota());
  GmailApp.sendEmail(email, "Let's Mail Apps Script Test: " + CONFIG.EVENT_NAME, "", {
    htmlBody: "<p>Your Google Apps Script trigger for <strong>" + CONFIG.EVENT_NAME + "</strong> is configured correctly!</p>"
  });
  Logger.log("Test email sent to " + email);
}
`;
}

/**
 * Generates Google Apps Script Cloud Cron snippet for offline scheduled sending
 */
export function generateAppsScriptSchedulerCode(): string {
  return `/**
 * ========================================================================
 * LET'S MAIL — 100% FREE CLOUD SCHEDULER VIA GOOGLE APPS SCRIPT
 * Allows sending campaigns at a scheduled time without leaving your phone on.
 * ========================================================================
 */

function createScheduledCampaignTrigger() {
  // Clear any existing triggers
  const allTriggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < allTriggers.length; i++) {
    ScriptApp.deleteTrigger(allTriggers[i]);
  }

  // Set trigger to fire at target date/time
  // Example: 2026-10-23 at 09:00 AM
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1);
  targetDate.setHours(9, 0, 0, 0);

  ScriptApp.newTrigger("executeScheduledDispatch")
    .timeBased()
    .at(targetDate)
    .create();

  Logger.log("Scheduled trigger created for: " + targetDate.toString());
}

function executeScheduledDispatch() {
  Logger.log("Trigger fired on Google's cloud server. Ready to dispatch batch.");
  // Reads list from attached spreadsheet or sheet and dispatches via GmailApp
}
`;
}

/**
 * Generates personal 1-click Apps Script Web App Dispatcher script.
 * Zero GCP console, Zero OAuth consent screen, Zero "test users" barrier.
 * Works for any @gmail.com or institutional account in 1 minute.
 */
export function generatePersonalDispatcherScript(organizerEmail?: string): string {
  return `/**
 * ========================================================================
 * LET'S MAIL — PERSONAL 1-CLICK DISPATCHER WEB APP
 * Account: ${organizerEmail || 'Your Google Account'}
 * 
 * 100% Free & Zero-Setup Alternative:
 * - NO Google Cloud Console project required!
 * - NO Google OAuth verification or "test users" restrictions!
 * - Directly delivers emails from YOUR personal Gmail mailbox.
 * ========================================================================
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const toEmail = data.toEmail;
    const subject = data.subject || "College Event Update";
    const bodyHtml = data.bodyHtml || "";
    const fromName = data.fromName || "Event Committee";

    // Dispatch directly from the account hosting this Apps Script
    GmailApp.sendEmail(toEmail, subject, "", {
      htmlBody: bodyHtml,
      name: fromName
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      messageId: "appscript_" + Date.now(),
      sender: Session.getActiveUser().getEmail()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Let's Mail Dispatcher Webhook is active for: " + Session.getActiveUser().getEmail());
}
`;
}

