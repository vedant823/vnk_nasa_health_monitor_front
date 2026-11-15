// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Escalating reminders. A check that is due starts as a quiet banner, becomes a dialog when it has
// been missed for a while, and is finally flagged on the Crew Medical Officer summary. The worse the
// last reading of that measurement was, the faster it escalates. Everything is worked out on the
// device from the backend's due dates, so it needs no link to Earth.
import type { Measurement, MeasurementSet, Reminder } from '../api/types';
import { DAY, HOUR, toMillis } from './dates';
import type { Zone } from './zones';

/** 0 = not due yet, 1 = quiet banner, 2 = dialog, 3 = flagged to the Crew Medical Officer. */
export type ReminderStage = 0 | 1 | 2 | 3;

export const STAGE_LABEL: Record<ReminderStage, string> = {
  0: 'Not due yet',
  1: 'Due',
  2: 'Overdue',
  3: 'Flagged to the Crew Medical Officer',
};

/** How long after the due time each step starts, by the zone of the measurement's last reading. */
export const GRACE: Record<'normal' | 'yellow' | 'red', { dialog: number; flag: number }> = {
  normal: { dialog: 24 * HOUR, flag: 72 * HOUR },
  yellow: { dialog: 12 * HOUR, flag: 48 * HOUR },
  red: { dialog: 6 * HOUR, flag: 24 * HOUR },
};

const paceOf = (zone: Zone): keyof typeof GRACE => (zone === 'red' || zone === 'emergency' ? 'red' : zone === 'yellow' ? 'yellow' : 'normal');

export function reminderStage(dueMs: number, zone: Zone, now = Date.now()): ReminderStage {
  const late = now - dueMs;
  if (late < 0) return 0;
  const grace = GRACE[paceOf(zone)];
  if (late >= grace.flag) return 3;
  if (late >= grace.dialog) return 2;
  return 1;
}

export interface MissedCheck {
  measurementId: string;
  name: string;
  dueMs: number;
  lateMs: number;
  zone: Zone;
  stage: ReminderStage;
}

/** "3 hours", "2 days". */
export function lateText(ms: number): string {
  if (ms < HOUR) return 'less than 1 hour';
  if (ms < 2 * DAY) {
    const hours = Math.floor(ms / HOUR);
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const days = Math.floor(ms / DAY);
  return `${days} days`;
}

interface Source {
  upcoming: Reminder[];
  measurements: Record<string, Measurement | undefined>;
  histories: Record<string, MeasurementSet[] | undefined>;
  zones: Record<string, Zone>;
}

/**
 * Checks that are due or missed, most escalated first. A measurement that has never been taken
 * stays at the quiet banner: a brand-new account should not open to fifteen alarms.
 */
export function missedChecks(source: Source, now = Date.now()): MissedCheck[] {
  const list: MissedCheck[] = [];
  for (const reminder of source.upcoming) {
    const id = reminder.measurementId;
    const dueMs = toMillis(reminder.dueDate);
    const zone = source.zones[id] ?? 'none';
    const taken = (source.histories[id] ?? []).length > 0;
    const stage = reminderStage(dueMs, zone, now);
    if (stage === 0) continue;
    list.push({
      measurementId: id,
      name: source.measurements[id]?.name ?? id.replace(/_/g, ' '),
      dueMs,
      lateMs: now - dueMs,
      zone,
      stage: taken ? stage : 1,
    });
  }
  return list.sort((a, b) => b.stage - a.stage || b.lateMs - a.lateMs);
}
