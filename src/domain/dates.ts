/**
 * Date and timezone utilities for EcO (Asia/Dhaka UTC+6)
 */

export function getTodayDateString(): string {
  // Asia/Dhaka is UTC+6
  const now = new Date();
  const dhakaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  const year = dhakaTime.getFullYear();
  const month = String(dhakaTime.getMonth() + 1).padStart(2, '0');
  const day = String(dhakaTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const today = getTodayDateString();
  
  if (dateStr === today) {
    return 'Today';
  }

  // Check for yesterday
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const [ty, tm, td] = today.split('-').map(Number);
  const todayDate = new Date(ty, tm - 1, td);
  const diffTime = todayDate.getTime() - targetDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 1) {
    return 'Yesterday';
  }

  // Format as "21 Oct 2026"
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

/**
 * Calculates end date for recurring expense: S + (D - 1) days inclusive
 */
export function calculateRecurringEndDate(startDateStr: string, durationDays: number): string {
  if (!startDateStr || durationDays <= 0) return startDateStr;
  const [y, m, d] = startDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + (durationDays - 1));
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

/**
 * Seven-day retention cutoff: 7 * 24 * 60 * 60 * 1000 ms
 */
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function isWithinSevenDays(timestamp: number): boolean {
  return Date.now() - timestamp <= SEVEN_DAYS_MS;
}
