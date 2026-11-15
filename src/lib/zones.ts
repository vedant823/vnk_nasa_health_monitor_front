// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Color zones. Cutoffs follow the backend's scoring rule: start at 100, minus 40 per abnormal
// reading, minus 75 per dangerous reading, floor of 1. So 100 = all normal, 60 = one abnormal,
// 25 or less = at least one dangerous (or two abnormal) reading.
import type { Measurement, MeasurementSet } from '../api/types';
import { toMillis } from './dates';

export type Zone = 'none' | 'green' | 'yellow' | 'red' | 'emergency';

export const ZONE_LABEL: Record<Zone, string> = {
  none: 'No readings yet',
  green: 'Healthy',
  yellow: 'Watch',
  red: 'Act now',
  emergency: 'Emergency',
};

/** Higher number = more urgent. Used to sort worst first. */
export const ZONE_RANK: Record<Zone, number> = { none: 0, green: 1, yellow: 2, red: 3, emergency: 4 };

export function scoreZone(score: number): Exclude<Zone, 'none' | 'emergency'> {
  if (score >= 61) return 'green';
  if (score >= 26) return 'yellow';
  return 'red';
}

export type Side = 'low' | 'high' | null;

/** Same comparison the backend's JudgementService makes. A null limit means "no limit on that side". */
export function classify(value: number, m: Measurement): { zone: 'green' | 'yellow' | 'red'; side: Side } {
  if (m.dangerousLow !== null && value < m.dangerousLow) return { zone: 'red', side: 'low' };
  if (m.abnormalLow !== null && value < m.abnormalLow) return { zone: 'yellow', side: 'low' };
  if (m.dangerousHigh !== null && value > m.dangerousHigh) return { zone: 'red', side: 'high' };
  if (m.abnormalHigh !== null && value > m.abnormalHigh) return { zone: 'yellow', side: 'high' };
  return { zone: 'green', side: null };
}

export const average = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

/** One reading per log: the average of its values, which is how the backend scores it. */
export function setValue(set: MeasurementSet): number | null {
  return set.values && set.values.length ? average(set.values) : null;
}

export function sortOldestFirst(history: MeasurementSet[]): MeasurementSet[] {
  return [...history].sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));
}

export function latestSet(history: MeasurementSet[] | undefined): MeasurementSet | null {
  if (!history || !history.length) return null;
  return sortOldestFirst(history)[history.length - 1];
}

/** Zone of the latest reading. Visual measurements are stored but not scored, so they stay 'none'. */
export function measurementZone(m: Measurement | undefined, history: MeasurementSet[] | undefined): Zone {
  if (!m || m.category === 'visual') return 'none';
  const latest = latestSet(history);
  const value = latest ? setValue(latest) : null;
  return value === null ? 'none' : classify(value, m).zone;
}

export const worstZone = (zones: Zone[]): Zone =>
  zones.reduce<Zone>((worst, z) => (ZONE_RANK[z] > ZONE_RANK[worst] ? z : worst), 'none');
