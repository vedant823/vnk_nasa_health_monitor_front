// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
import type { Reminder } from '../api/types';

export const DAY = 86_400_000;
export const HOUR = 3_600_000;

/** Accepts ISO strings, epoch milliseconds, or epoch seconds (older Jackson setups). */
export function toMillis(value: string | number): number {
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value;
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return parsed;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : toMillis(numeric);
}

/** Local calendar day key, e.g. 2026-11-15. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export interface DueInfo {
  text: string;
  overdue: boolean;
  dueNow: boolean;
}

/** "Due now", "Overdue 2 days", "Due in 3 h", "Due Nov 21". */
export function describeDue(dueMs: number, now = Date.now()): DueInfo {
  const diff = dueMs - now;
  if (diff <= -DAY) {
    const days = Math.floor(-diff / DAY);
    return { text: `Overdue ${days} day${days === 1 ? '' : 's'}`, overdue: true, dueNow: true };
  }
  if (diff <= 5 * 60_000) return { text: 'Due now', overdue: diff < -HOUR, dueNow: true };
  if (diff < HOUR) return { text: `Due in ${Math.max(1, Math.round(diff / 60_000))} min`, overdue: false, dueNow: false };
  if (diff < DAY) return { text: `Due in ${Math.round(diff / HOUR)} h`, overdue: false, dueNow: false };
  if (diff < 7 * DAY) {
    const days = Math.round(diff / DAY);
    return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, overdue: false, dueNow: false };
  }
  return { text: `Due ${formatDate(dueMs)}`, overdue: false, dueNow: false };
}

export interface ReminderGroups {
  today: Reminder[];
  week: Reminder[];
  month: Reminder[];
}

/** Splits reminders into Today, Later this week and Later this month (each reminder appears once). */
export function groupReminders(reminders: Reminder[], now = Date.now()): ReminderGroups {
  const groups: ReminderGroups = { today: [], week: [], month: [] };
  const sorted = [...reminders].sort((a, b) => toMillis(a.dueDate) - toMillis(b.dueDate));
  for (const r of sorted) {
    const due = toMillis(r.dueDate);
    if (due <= now + DAY) groups.today.push(r);
    else if (due <= now + 7 * DAY) groups.week.push(r);
    else groups.month.push(r);
  }
  return groups;
}
