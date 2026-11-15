// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Streak, weekly progress, readiness score and badges. Everything is worked out in the browser
// from the measurement history the backend returns.
import type { Measurement, MeasurementSet } from '../api/types';
import { DAY, dayKey, toMillis } from './dates';
import { classify, scoreZone, setValue, sortOldestFirst, type Zone } from './zones';

export type Histories = Record<string, MeasurementSet[] | undefined>;

/** Days in a row (ending today or yesterday) with at least one measurement logged. */
export function checkInStreak(histories: Histories, now = Date.now()): number {
  const days = new Set<string>();
  for (const history of Object.values(histories)) for (const set of history ?? []) days.add(dayKey(toMillis(set.timestamp)));
  let cursor = now;
  if (!days.has(dayKey(cursor))) cursor -= DAY;
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

/** How many of the listed measurements have a reading in the last 7 days. */
export function weekProgress(ids: string[], histories: Histories, now = Date.now()): { done: number; total: number } {
  const done = ids.filter((id) => (histories[id] ?? []).some((set) => now - toMillis(set.timestamp) <= 7 * DAY)).length;
  return { done, total: ids.length };
}

export interface ScoredRisk {
  score: number;
  zone: Zone;
}

/** Average score of risks that have readings. Any red risk caps it at 25 so it is never hidden. */
export function readinessScore(risks: ScoredRisk[]): number | null {
  const scored = risks.filter((r) => r.zone !== 'none');
  if (!scored.length) return null;
  const mean = Math.round(scored.reduce((sum, r) => sum + r.score, 0) / scored.length);
  return scored.some((r) => r.zone === 'red' || r.zone === 'emergency') ? Math.min(mean, 25) : mean;
}

export const readinessZone = (score: number | null): Zone => (score === null ? 'none' : scoreZone(score));

export interface Badge {
  id: string;
  name: string;
  how: string;
  earned: boolean;
}

function loggedDays(history: MeasurementSet[] | undefined): Set<string> {
  return new Set((history ?? []).map((set) => dayKey(toMillis(set.timestamp))));
}

function dayRun(days: Set<string>, now: number): number {
  let cursor = now;
  if (!days.has(dayKey(cursor))) cursor -= DAY;
  let run = 0;
  while (days.has(dayKey(cursor))) {
    run += 1;
    cursor -= DAY;
  }
  return run;
}

function lastGreen(m: Measurement | undefined, history: MeasurementSet[] | undefined, count: number): boolean {
  if (!m || !history || history.length < count) return false;
  return sortOldestFirst(history)
    .slice(-count)
    .every((set) => {
      const value = setValue(set);
      return value !== null && classify(value, m).zone === 'green';
    });
}

/**
 * Badge rules. Each badge only appears when the backend lists the measurement it depends on,
 * so nothing here breaks if the measurement list changes.
 */
export function computeBadges(
  measurements: Record<string, Measurement | undefined>,
  histories: Histories,
  risks: ScoredRisk[],
  now = Date.now(),
): Badge[] {
  const has = (id: string) => measurements[id] !== undefined;
  const count = (id: string) => (histories[id] ?? []).length;
  const anyLogged = Object.values(histories).some((h) => (h ?? []).length > 0);
  const scored = risks.filter((r) => r.zone !== 'none');
  const badges: Badge[] = [
    { id: 'first-check-in', name: 'First Check-in', how: 'Log any measurement.', earned: anyLogged },
    { id: 'week-streak', name: 'Week Streak', how: 'Check in 7 days in a row.', earned: checkInStreak(histories, now) >= 7 },
  ];
  if (has('intraocular_pressure') && has('oct_fundus_scan'))
    badges.push({ id: 'eagle-eye', name: 'Eagle Eye', how: 'Log both an eye pressure reading and an eye scan.', earned: count('intraocular_pressure') > 0 && count('oct_fundus_scan') > 0 });
  if (has('sleep_duration'))
    badges.push({ id: 'deep-sleeper', name: 'Deep Sleeper', how: 'Two sleep logs in a row in the healthy range.', earned: lastGreen(measurements.sleep_duration, histories.sleep_duration, 2) });
  if (has('balance_score_change'))
    badges.push({ id: 'steady-horizon', name: 'Steady Horizon', how: 'Three balance checks in a row in the healthy range.', earned: lastGreen(measurements.balance_score_change, histories.balance_score_change, 3) });
  if (has('grip_strength_change'))
    badges.push({ id: 'strong-grip', name: 'Strong Grip', how: 'Three grip checks in a row in the healthy range.', earned: lastGreen(measurements.grip_strength_change, histories.grip_strength_change, 3) });
  if (has('mood_score'))
    badges.push({ id: 'mind-zen', name: 'Mind Zen', how: 'Log your mood 7 days in a row.', earned: dayRun(loggedDays(histories.mood_score), now) >= 7 });
  if (has('solar_proton_flux'))
    badges.push({ id: 'storm-watch', name: 'Storm Watch', how: 'Check solar proton flux 5 times.', earned: count('solar_proton_flux') >= 5 });
  badges.push({ id: 'all-green', name: 'All Green', how: 'Every risk with readings in the healthy zone.', earned: scored.length >= 3 && scored.every((r) => r.zone === 'green') });
  return badges;
}

const BADGE_KEY = 'chm.badges';

/** Returns badges earned since the last call for this user, and remembers them. */
export function takeNewBadges(username: string, badges: Badge[]): Badge[] {
  const key = `${BADGE_KEY}.${username}`;
  const stored = localStorage.getItem(key);
  let seen: string[] = [];
  try {
    seen = JSON.parse(stored ?? '[]') as string[];
  } catch {
    seen = [];
  }
  const earned = badges.filter((b) => b.earned);
  const fresh = earned.filter((b) => !seen.includes(b.id));
  if (fresh.length || stored === null) localStorage.setItem(key, JSON.stringify(earned.map((b) => b.id)));
  // On the first visit from this browser there is nothing to compare with, so do not announce old badges.
  return stored === null ? [] : fresh;
}
