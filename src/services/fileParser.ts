import * as XLSX from 'xlsx';
import { Recipient } from '../types';

export interface ParseResult {
  headers: string[];
  detectedEmailCol: string;
  detectedNameCol: string;
  recipients: Recipient[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  totalRows: number;
  fileName: string;
}

// RFC 5322 simplified email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  return EMAIL_REGEX.test(trimmed);
}

export async function parseRecipientFile(file: File): Promise<ParseResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('The uploaded file does not contain any sheets or readable tables.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse as array of objects
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false
  });

  if (rawRows.length === 0) {
    throw new Error('The spreadsheet is empty. Please ensure your file has headers and rows.');
  }

  // Extract headers
  const headers = Object.keys(rawRows[0] || {});

  // Guess email column
  const emailColCandidate = headers.find((h) => {
    const lower = h.toLowerCase().trim();
    return lower === 'email' || lower === 'mail' || lower === 'e-mail' || lower === 'email_address' || lower.includes('email');
  }) || headers[0] || '';

  // Guess name column
  const nameColCandidate = headers.find((h) => {
    const lower = h.toLowerCase().trim();
    return lower === 'name' || lower === 'full_name' || lower === 'fullname' || lower === 'student_name' || lower === 'first_name' || lower.includes('name');
  }) || '';

  return processRows(rawRows, headers, emailColCandidate, nameColCandidate, file.name);
}

export function reprocessWithEmailColumn(
  rawRows: Record<string, unknown>[],
  headers: string[],
  selectedEmailCol: string,
  selectedNameCol: string,
  fileName: string
): ParseResult {
  return processRows(rawRows, headers, selectedEmailCol, selectedNameCol, fileName);
}

function processRows(
  rows: Record<string, unknown>[],
  headers: string[],
  emailCol: string,
  nameCol: string,
  fileName: string
): ParseResult {
  const recipients: Recipient[] = [];
  const seenEmails = new Set<string>();
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  rows.forEach((row, idx) => {
    const rawEmail = String(row[emailCol] ?? '').trim();
    const rawName = nameCol && row[nameCol] ? String(row[nameCol]).trim() : '';

    const stringData: Record<string, string> = {};
    headers.forEach((h) => {
      stringData[h] = String(row[h] ?? '').trim();
    });

    // Add lowercase standardized keys for easier placeholder matching
    headers.forEach((h) => {
      stringData[h.toLowerCase()] = String(row[h] ?? '').trim();
    });

    const validSyntax = isValidEmail(rawEmail);
    const normalizedEmail = rawEmail.toLowerCase();
    const isDuplicate = seenEmails.has(normalizedEmail);

    let validationError: string | undefined;
    if (!rawEmail) {
      validationError = 'Email is empty';
    } else if (!validSyntax) {
      validationError = 'Invalid email syntax';
    } else if (isDuplicate) {
      validationError = 'Duplicate email address';
      duplicateCount++;
    }

    if (validSyntax && !isDuplicate) {
      seenEmails.add(normalizedEmail);
      validCount++;
    } else if (!validSyntax) {
      invalidCount++;
    }

    recipients.push({
      id: `rec_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
      email: rawEmail,
      name: rawName || undefined,
      data: stringData,
      isValid: validSyntax && !isDuplicate,
      validationError,
      isDuplicate
    });
  });

  return {
    headers,
    detectedEmailCol: emailCol,
    detectedNameCol: nameCol,
    recipients,
    validCount,
    invalidCount,
    duplicateCount,
    totalRows: rows.length,
    fileName
  };
}

/**
 * Generates sample CSV / Excel files for testing
 */
export function generateSampleCsvContent(): string {
  return `name,email,event,participant_id,login_link
Aarav Sharma,aarav.student@sbjit.edu.in,National AI Hackathon 2026,REG-AI-1042,https://portal.sbjit.edu/checkin/1042
Priya Patel,priya.patel@sbjit.edu.in,Web3 & Cloud Summit,REG-WC-2098,https://portal.sbjit.edu/checkin/2098
Rohan Deshmukh,rohan.d@sbjit.edu.in,Robotics Challenge,REG-RB-3301,https://portal.sbjit.edu/checkin/3301
Ananya Joshi,ananya.j@sbjit.edu.in,National AI Hackathon 2026,REG-AI-1045,https://portal.sbjit.edu/checkin/1045
Karan Verma,karan.v@sbjit.edu.in,Design Sprint & UX Showcase,REG-UX-4120,https://portal.sbjit.edu/checkin/4120
Neha Kulkarni,neha.k@sbjit.edu.in,Web3 & Cloud Summit,REG-WC-2104,https://portal.sbjit.edu/checkin/2104`;
}
