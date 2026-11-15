// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Extreme readings. When the latest reading of a measurement is far past its act-now limit, the app
// prepares a Crew Medical Officer packet and starts a short countdown, after which the ground crew
// is marked as notified. Undoing, deleting or correcting the reading withdraws the alert.
//
// SIMULATED: this prototype has no link to the ground and sends nothing off the device. "Notified"
// is a status shown in the app. The backend has no alert endpoint, so alerts are kept in this
// browser, per account.
import type { Measurement, MeasurementSet } from '../api/types';
import { displayUnit, formatValue } from '../content/inputSpecs';
import { formatGmt } from './changeLog';
import { toMillis } from './dates';
import { commDelayText, type Environment } from './environment';
import { classify, latestSet, setValue, sortOldestFirst } from './zones';

/** Time the crew member has to undo a mistaken reading before the ground crew is marked notified. */
export const GRACE_MS = 5 * 60_000;

export interface ExtremeInfo {
  side: 'low' | 'high';
  /** The act-now (red) limit that was passed. */
  redLimit: number;
  /** The extreme limit that was passed. */
  extremeLimit: number;
}

/**
 * "Very extreme" = past the act-now limit by at least the full width of the watch (yellow) band on
 * that side. Example: resting heart rate is watch from 100 and act-now from 120, so the band is 20
 * and the reading is extreme above 140. On the low side it is watch below 50, act-now below 40, so
 * extreme below 30. For a measurement that cannot go below zero, the low extreme limit stops at 0
 * and a reading of exactly 0 counts.
 */
export function extremeInfo(value: number, m: Measurement): ExtremeInfo | null {
  if (m.category === 'visual') return null;
  if (m.dangerousLow !== null && m.abnormalLow !== null && m.abnormalLow > m.dangerousLow) {
    let limit = m.dangerousLow - (m.abnormalLow - m.dangerousLow);
    let hit = value < limit;
    if (!m.canBeNegative && limit < 0) {
      limit = 0;
      hit = value <= 0;
    }
    if (hit) return { side: 'low', redLimit: m.dangerousLow, extremeLimit: limit };
  }
  if (m.dangerousHigh !== null && m.abnormalHigh !== null && m.dangerousHigh > m.abnormalHigh) {
    const limit = m.dangerousHigh + (m.dangerousHigh - m.abnormalHigh);
    if (value > limit) return { side: 'high', redLimit: m.dangerousHigh, extremeLimit: limit };
  }
  return null;
}

export interface GroundAlert {
  /** measurementId + reading time: one alert per reading. */
  key: string;
  measurementId: string;
  measurementName: string;
  /** "165 beats per minute" */
  valueText: string;
  side: 'low' | 'high';
  /** "above 140 beats per minute (act-now limit 120)" */
  limitText: string;
  readingTakenAt: string;
  createdAt: string;
  /** When the ground crew is marked as notified, unless the alert is withdrawn first. */
  notifyAt: string;
  /** Set when the reading was undone, deleted or corrected. */
  withdrawnAt: string | null;
}

export type AlertStatus = 'pending' | 'notified' | 'withdrawn';

export function alertStatus(alert: GroundAlert, now = Date.now()): AlertStatus {
  if (alert.withdrawnAt) return 'withdrawn';
  return now >= Date.parse(alert.notifyAt) ? 'notified' : 'pending';
}

/** Whether the ground crew had already been marked notified when the reading was withdrawn. */
export const withdrawnAfterNotice = (alert: GroundAlert) => alert.withdrawnAt !== null && Date.parse(alert.withdrawnAt) >= Date.parse(alert.notifyAt);

const MAX_ALERTS = 50;
const storageKey = (username: string) => `chm.alerts.${username}`;

/** Newest first. */
export function loadAlerts(username: string): GroundAlert[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(username)) ?? '[]') as unknown;
    return Array.isArray(parsed) ? (parsed as GroundAlert[]) : [];
  } catch {
    return [];
  }
}

function saveAlerts(username: string, alerts: GroundAlert[]) {
  try {
    localStorage.setItem(storageKey(username), JSON.stringify(alerts.slice(0, MAX_ALERTS)));
  } catch {
    // Storage blocked: alerts still show until the page is reloaded.
  }
}

const iso = (ms: number) => new Date(ms).toISOString();

/**
 * Brings the stored alerts in line with the readings: a new alert for every measurement whose
 * latest reading is extreme, and a withdrawal for every alert whose reading no longer exists.
 */
export function syncAlerts(
  username: string,
  measurements: Record<string, Measurement | undefined>,
  histories: Record<string, MeasurementSet[] | undefined>,
  now = Date.now(),
): GroundAlert[] {
  const alerts = loadAlerts(username);
  let changed = false;
  for (const alert of alerts) {
    const history = histories[alert.measurementId];
    if (alert.withdrawnAt || !history) continue;
    const stillThere = history.some((set) => `${alert.measurementId}@${toMillis(set.timestamp)}` === alert.key);
    if (!stillThere) {
      alert.withdrawnAt = iso(now);
      changed = true;
    }
  }
  for (const [id, m] of Object.entries(measurements)) {
    const latest = latestSet(histories[id]);
    const value = latest ? setValue(latest) : null;
    if (!m || !latest || value === null) continue;
    const info = extremeInfo(value, m);
    if (!info) continue;
    const takenMs = toMillis(latest.timestamp);
    const key = `${id}@${takenMs}`;
    if (alerts.some((a) => a.key === key)) continue;
    const unit = displayUnit(m);
    alerts.unshift({
      key,
      measurementId: id,
      measurementName: m.name,
      valueText: `${formatValue(value)} ${unit}`,
      side: info.side,
      limitText: `${info.side === 'low' ? (value <= 0 && info.extremeLimit === 0 ? 'at or below' : 'below') : 'above'} ${formatValue(info.extremeLimit)} ${unit} (act-now limit ${formatValue(info.redLimit)})`,
      readingTakenAt: iso(takenMs),
      createdAt: iso(now),
      notifyAt: iso(now + GRACE_MS),
      withdrawnAt: null,
    });
    changed = true;
  }
  if (changed) saveAlerts(username, alerts);
  return alerts;
}

/** Marks the ground crew as notified straight away (the "Notify now" button). */
export function notifyNow(username: string, key: string, now = Date.now()): GroundAlert[] {
  const alerts = loadAlerts(username);
  const alert = alerts.find((a) => a.key === key);
  if (alert && !alert.withdrawnAt && Date.parse(alert.notifyAt) > now) {
    alert.notifyAt = iso(now);
    saveAlerts(username, alerts);
  }
  return alerts;
}

/** "4:32" */
export function countdownText(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

interface PacketContext {
  username: string;
  environment: Environment;
  measurement: Measurement | undefined;
  history: MeasurementSet[] | undefined;
  /** Risks that use this measurement: name and current score. */
  risks: { name: string; score: number | null }[];
  now?: number;
}

/** The Crew Medical Officer packet as plain text, ready to read out, copy or print. */
export function buildPacket(alert: GroundAlert, ctx: PacketContext): string {
  const now = ctx.now ?? Date.now();
  const status = alertStatus(alert, now);
  const m = ctx.measurement;
  const advice = m ? (alert.side === 'low' ? m.lowRecommendation : m.highRecommendation) : null;
  const recent = sortOldestFirst(ctx.history ?? [])
    .slice(-5)
    .reverse()
    .map((set) => {
      const value = setValue(set);
      const zone = value !== null && m ? classify(value, m).zone : null;
      const word = zone === 'red' ? 'act now' : zone === 'yellow' ? 'watch' : zone === 'green' ? 'healthy' : 'not scored';
      return `  ${formatGmt(toMillis(set.timestamp))}: ${value === null ? 'image' : `${formatValue(value)}${m ? ` ${displayUnit(m)}` : ''}`} (${word})`;
    });
  const statusLine =
    status === 'pending'
      ? `Ground crew notification: PENDING. Will be marked notified at ${formatGmt(alert.notifyAt)} unless the reading is undone.`
      : status === 'notified'
        ? `Ground crew notification: MARKED NOTIFIED at ${formatGmt(alert.notifyAt)}.`
        : `WITHDRAWN at ${formatGmt(alert.withdrawnAt)}: the reading was undone, deleted or corrected${withdrawnAfterNotice(alert) ? ' after the ground crew had been marked notified' : ' before the ground crew was notified'}.`;
  return [
    'CREW MEDICAL OFFICER PACKET: EXTREME READING',
    `Prepared ${formatGmt(now)}`,
    `Crew member: ${ctx.username || 'unknown'}`,
    `Environment: ${ctx.environment.name}`,
    '',
    `Measurement: ${alert.measurementName}`,
    `Reading: ${alert.valueText}, taken ${formatGmt(alert.readingTakenAt)}`,
    `Why it is extreme: the reading is ${alert.limitText}.`,
    '',
    'Last readings, newest first:',
    ...(recent.length ? recent : ['  none on record']),
    '',
    'Risks this measurement feeds:',
    ...(ctx.risks.length ? ctx.risks.map((r) => `  ${r.name}: ${r.score === null ? 'not scored' : `${r.score} of 100`}`) : ['  none']),
    '',
    `Advice shown to the crew member: ${advice ?? 'Repeat the measurement and see the Crew Medical Officer.'}`,
    'First steps: stop strenuous tasks, repeat the measurement to rule out a mistake, ask about chest pain, fainting, confusion, trouble breathing and loss of vision.',
    '',
    `Message delay to Earth: ${commDelayText(ctx.environment).toLowerCase()}. ${ctx.environment.care}`,
    statusLine,
    '',
    'Simulated in this prototype: nothing is sent off this device. Not a medical device.',
  ].join('\n');
}
