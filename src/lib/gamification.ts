// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Streak, weekly progress, readiness score and badges. Everything is worked out in the browser
// from the measurement history the backend returns. Badges are the exception: the backend
// decides which are earned (GET /users/badges) and this file only formats them.
import type { BadgeCriterion, BadgeRule, BadgeSet, Measurement, MeasurementSet } from '../api/types';
import { DAY, dayKey, toMillis } from './dates';
import { scoreZone, type Zone } from './zones';

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
  /** 0 to 1: how far along the badge is (the average over its criteria). */
  progress: number;
}

function criterionText(c: BadgeCriterion, measurements: Record<string, Measurement | undefined>): string {
  const known = Object.keys(measurements).filter((id) => measurements[id]);
  const coversAll = known.length > 0 && known.every((id) => c.measurementType.includes(id));
  const names = coversAll ? 'any measurement' : c.measurementType.map((id) => measurements[id]?.name ?? id.replace(/_/g, ' ')).join(' or ');
  const ok = c.isOk ? ' in the healthy range' : '';
  if (c.streak) return `log ${names}${ok} on ${c.count} days in a row`;
  if (c.distinctDays) return `log ${names}${ok} on ${c.count} different days`;
  return `log ${names}${ok} ${c.count === 1 ? 'once' : `${c.count} times`}`;
}

const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function toBadge(rule: BadgeRule, earned: boolean, progress: number, measurements: Record<string, Measurement | undefined>): Badge {
  const criteria = Array.isArray(rule.criteria) ? rule.criteria : [];
  const how = criteria.map((c) => criterionText(c, measurements)).join(', and ');
  return {
    id: slug(rule.title),
    name: rule.title,
    // Use the badge's own description when the backend sends one; otherwise describe its criteria.
    how: typeof rule.description === 'string' && rule.description.trim() ? rule.description.trim() : how ? `${how.charAt(0).toUpperCase()}${how.slice(1)}.` : '',
    earned,
    progress,
  };
}

/**
 * Turns the backend's badge answer into the list the screens show: earned badges first, then the
 * rest with their progress. The backend decides what is earned; nothing is worked out here.
 */
export function badgesFromServer(set: BadgeSet | undefined, measurements: Record<string, Measurement | undefined>): Badge[] {
  if (!set) return [];
  const earned = (set.earned ?? []).filter((rule) => rule && typeof rule.title === 'string').map((rule) => toBadge(rule, true, 1, measurements));
  const unearned = (set.unearned ?? [])
    .filter((status) => status?.badge && typeof status.badge.title === 'string')
    .map((status) => {
      const parts = Array.isArray(status.progress) ? status.progress.filter((p) => Number.isFinite(p)) : [];
      const mean = parts.length ? parts.reduce((a, b) => a + Math.min(1, Math.max(0, b)), 0) / parts.length : 0;
      return toBadge(status.badge, false, mean, measurements);
    });
  return [...earned, ...unearned];
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
