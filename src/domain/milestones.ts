/**
 * Lending and Debt Milestone Engine
 * Accurate calendar-based milestone calculation in Asia/Dhaka timezone
 */

import { formatTaka } from './money';
import { formatDisplayDate } from './dates';
import { PersonRecord, PeerTransactionRecord } from './types';

export type MilestoneKey = '7_days' | '15_days' | '1_month' | '2_months' | '6_months' | '1_year';

export interface MilestoneDef {
  key: MilestoneKey;
  labelEn: string;
  labelBn: string;
  type: 'days' | 'months' | 'years';
  value: number;
}

export const MILESTONE_SCHEDULE: MilestoneDef[] = [
  { key: '7_days', labelEn: '7 days', labelBn: '৭ দিন', type: 'days', value: 7 },
  { key: '15_days', labelEn: '15 days', labelBn: '১৫ দিন', type: 'days', value: 15 },
  { key: '1_month', labelEn: '1 month', labelBn: '১ মাস', type: 'months', value: 1 },
  { key: '2_months', labelEn: '2 months', labelBn: '২ মাস', type: 'months', value: 2 },
  { key: '6_months', labelEn: '6 months', labelBn: '৬ মাস', type: 'months', value: 6 },
  { key: '1_year', labelEn: '1 year', labelBn: '১ বছর', type: 'years', value: 1 }
];

/**
 * Calculates calendar date addition with month-end clipping.
 * E.g., Jan 31 + 1 month = Feb 28 (or Feb 29 on leap year)
 */
export function addCalendarMonths(dateStr: string, monthsToAdd: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetMonthIndex = (month - 1) + monthsToAdd;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12; // 0..11

  // Determine last valid day in target month
  const lastDayOfTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  const yStr = String(targetYear);
  const mStr = String(normalizedMonth + 1).padStart(2, '0');
  const dStr = String(clampedDay).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

export function addCalendarDays(dateStr: string, daysToAdd: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + daysToAdd);
  const yStr = String(d.getFullYear());
  const mStr = String(d.getMonth() + 1).padStart(2, '0');
  const dStr = String(d.getDate()).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

export function addCalendarYears(dateStr: string, yearsToAdd: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetYear = year + yearsToAdd;
  const lastDayOfTargetMonth = new Date(targetYear, month, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  const yStr = String(targetYear);
  const mStr = String(month).padStart(2, '0');
  const dStr = String(clampedDay).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

/**
 * Returns the exact target milestone date for a loan starting on loanDateStr
 */
export function getMilestoneTargetDate(loanDateStr: string, milestoneKey: MilestoneKey): string {
  const def = MILESTONE_SCHEDULE.find((m) => m.key === milestoneKey);
  if (!def) return loanDateStr;

  if (def.type === 'days') {
    return addCalendarDays(loanDateStr, def.value);
  }
  if (def.type === 'months') {
    return addCalendarMonths(loanDateStr, def.value);
  }
  return addCalendarYears(loanDateStr, def.value);
}

/**
 * Evaluates the active milestone for a loan given its recorded date and today's date.
 */
export function evaluateLoanMilestone(
  loanDateStr: string,
  todayDateStr: string
): {
  highestReachedMilestone: MilestoneDef | null;
  reachedMilestones: MilestoneDef[];
  daysElapsed: number;
} {
  const [ly, lm, ld] = loanDateStr.split('-').map(Number);
  const [ty, tm, td] = todayDateStr.split('-').map(Number);
  const loanTime = new Date(ly, lm - 1, ld).getTime();
  const todayTime = new Date(ty, tm - 1, td).getTime();
  const diffDays = Math.max(0, Math.round((todayTime - loanTime) / (1000 * 3600 * 24)));

  const reached: MilestoneDef[] = [];
  for (const milestone of MILESTONE_SCHEDULE) {
    const targetDate = getMilestoneTargetDate(loanDateStr, milestone.key);
    if (todayDateStr >= targetDate) {
      reached.push(milestone);
    }
  }

  const highest = reached.length > 0 ? reached[reached.length - 1] : null;

  return {
    highestReachedMilestone: highest,
    reachedMilestones: reached,
    daysElapsed: diffDays
  };
}

export interface LoanMilestoneReminderItem {
  personId: string;
  personName: string;
  phone?: string;
  direction: 'receivable' | 'payable'; // 'receivable' = they owe user; 'payable' = user owes them
  outstandingAmount: number;
  originalRecordedDate: string;
  formattedRecordedDate: string;
  daysElapsed: number;
  currentMilestone: MilestoneDef | null;
  allMilestones: {
    key: MilestoneKey;
    labelEn: string;
    labelBn: string;
    targetDate: string;
    isReached: boolean;
  }[];
  whatsAppReminderText?: string;
  whatsAppUrl?: string;
}

/**
 * Normalizes phone numbers for WhatsApp compatibility.
 * Removes all non-digit characters.
 * Ensures the Bangladesh country code (880) is applied if local 11-digit (starts with 01),
 * while preventing any duplicate country codes (e.g. 880880...).
 */
export function normalizeWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  // If already starts with Bangladesh country code 880
  if (digits.startsWith('880')) {
    return digits;
  }
  // If local 11-digit mobile number starting with 01 (e.g. 017XXXXXXXX)
  if (digits.startsWith('01') && digits.length === 11) {
    return '88' + digits;
  }
  // Otherwise return clean digits
  return digits;
}

/**
 * Formats concise, polite English WhatsApp reminder message for money owed to the user.
 * Requirement 2.1: English-only milestone interface.
 */
export function buildEnglishWhatsAppReminder(
  personName: string,
  amount: number,
  milestoneEn: string,
  recordedDateStr: string
): string {
  const formattedAmt = formatTaka(amount);
  const displayDate = formatDisplayDate(recordedDateStr);

  return `Hello ${personName},

This is a friendly reminder from EcO Smart Ledger.

An outstanding balance of ${formattedAmt} recorded on ${displayDate} (${milestoneEn} ago) is due for repayment.

Please let me know when it is convenient for you. If you have already repaid this or if there are any discrepancies, feel free to let me know.

Thank you.
— EcO Smart Ledger`;
}

/**
 * Formats polite Bangla WhatsApp reminder message for money owed to the user.
 * Kept for optional/legacy Bangla support outside the English milestone interface.
 */
export function buildBanglaWhatsAppReminder(
  personName: string,
  amount: number,
  milestoneBn: string,
  recordedDateStr: string
): string {
  const formattedAmt = formatTaka(amount);
  const displayDate = formatDisplayDate(recordedDateStr);

  return `আসসালামু আলাইকুম ${personName},

EcO Smart Ledger থেকে একটি বন্ধুত্বপূর্ণ রিমাইন্ডার জানানো হচ্ছে।

আপনার কাছে আমার পাওনা ${formattedAmt}, যা ${milestoneBn} আগে, ${displayDate} তারিখে লেনদেন হিসেবে রেকর্ড করা হয়েছিল।

সুযোগমতো বিষয়টি দেখে জানাবেন। কোনো ভুল থাকলে বা ইতোমধ্যে পরিশোধ করে থাকলে আমাকে জানাতে পারেন।

ধন্যবাদ।

— EcO Smart Ledger`;
}

/**
 * Computes all outstanding loans and their milestone reminder statuses.
 */
export function computeDashboardLoanReminders(
  people: PersonRecord[],
  transactions: PeerTransactionRecord[],
  personBalances: Map<string, number>,
  todayDateStr: string,
  dismissedMilestonesMap: Record<string, string[]> = {}
): {
  activeReminders: LoanMilestoneReminderItem[];
  allSettled: boolean;
  hasOutstandingWithoutReminder: boolean;
} {
  let hasOutstanding = false;
  const activeReminders: LoanMilestoneReminderItem[] = [];

  people.forEach((person) => {
    const netBalance = personBalances.get(person.id) || 0;
    if (netBalance === 0) return; // Fully settled or no debt

    hasOutstanding = true;
    const direction: 'receivable' | 'payable' = netBalance > 0 ? 'receivable' : 'payable';
    const outstandingAmount = Math.abs(netBalance);

    // Find the relevant primary transaction date
    // For receivable: find the give transactions that established the debt
    // For payable: find the take transactions
    const relevantTxs = transactions
      .filter((t) => t.personId === person.id && t.status !== 'rejected' && t.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date));

    // Earliest qualifying transaction date for baseline age
    const firstTx = relevantTxs[0];
    const originalDate = firstTx ? firstTx.date : todayDateStr;

    const { highestReachedMilestone, daysElapsed } = evaluateLoanMilestone(originalDate, todayDateStr);

    // All milestones breakdown for details modal
    const allMilestones = MILESTONE_SCHEDULE.map((m) => {
      const targetDate = getMilestoneTargetDate(originalDate, m.key);
      return {
        key: m.key,
        labelEn: m.labelEn,
        labelBn: m.labelBn,
        targetDate,
        isReached: todayDateStr >= targetDate
      };
    });

    // Check if dismissed
    const dismissedForPerson = dismissedMilestonesMap[person.id] || [];
    const isDismissed = highestReachedMilestone && dismissedForPerson.includes(highestReachedMilestone.key);

    let whatsAppReminderText: string | undefined;
    let whatsAppUrl: string | undefined;

    if (direction === 'receivable' && highestReachedMilestone) {
      // English-only milestone reminder text (Requirement 2.1)
      whatsAppReminderText = buildEnglishWhatsAppReminder(
        person.name,
        outstandingAmount,
        highestReachedMilestone.labelEn,
        originalDate
      );
      if (person.phone) {
        const normalized = normalizeWhatsAppPhone(person.phone);
        if (normalized) {
          whatsAppUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(whatsAppReminderText)}`;
        }
      }
    }

    if (highestReachedMilestone && !isDismissed) {
      activeReminders.push({
        personId: person.id,
        personName: person.name,
        phone: person.phone,
        direction,
        outstandingAmount,
        originalRecordedDate: originalDate,
        formattedRecordedDate: formatDisplayDate(originalDate),
        daysElapsed,
        currentMilestone: highestReachedMilestone,
        allMilestones,
        whatsAppReminderText,
        whatsAppUrl
      });
    }
  });

  // Sort: longest elapsed first
  activeReminders.sort((a, b) => b.daysElapsed - a.daysElapsed);

  const allSettled = !hasOutstanding;
  const hasOutstandingWithoutReminder = hasOutstanding && activeReminders.length === 0;

  return {
    activeReminders,
    allSettled,
    hasOutstandingWithoutReminder
  };
}
