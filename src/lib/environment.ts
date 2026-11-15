// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Mission environments. The five environments, their communication delay, evacuation notes and the
// ranges that differ from the space station all come from the team's ranges guide ("Ranges by
// environment" and "Environments" tabs) and its data file metric_ranges_by_environment.csv.
// The backend stores the environment (GET and PUT /users/environment) and scores risks with it.
// This browser only remembers that the crew member has made a choice, so a new account is asked once.
import type { Measurement } from '../api/types';

export type EnvironmentId = 'spacecraft' | 'station' | 'rover' | 'moon' | 'mars';

export interface Environment {
  id: EnvironmentId;
  name: string;
  summary: string;
  /** One-way communication delay to Earth, in minutes. */
  commDelayMin: number;
  dust: boolean;
  deepSpace: boolean;
  reducedOxygen: boolean;
  /** How quickly the crew member can get back to full medical care. */
  care: string;
}

export const ENVIRONMENTS: Environment[] = [
  {
    id: 'spacecraft',
    name: 'Spacecraft in transit',
    summary: 'A small capsule travelling between Earth, the Moon or beyond.',
    commDelayMin: 0.05,
    dust: false,
    deepSpace: true,
    reducedOxygen: false,
    care: 'Return depends on the trajectory.',
  },
  {
    id: 'station',
    name: 'Space station (low Earth orbit)',
    summary: 'A station orbiting close to Earth, inside its magnetic field.',
    commDelayMin: 0,
    dust: false,
    deepSpace: false,
    reducedOxygen: false,
    care: 'Emergency return takes a few hours to 36 hours.',
  },
  {
    id: 'rover',
    name: 'Pressurized rover',
    summary: 'A closed vehicle driving on the surface, away from the base.',
    commDelayMin: 0.02,
    dust: true,
    deepSpace: true,
    reducedOxygen: true,
    care: 'Drive back to base first, then follow the base plan.',
  },
  {
    id: 'moon',
    name: 'Moon base',
    summary: 'A habitat on the lunar surface.',
    commDelayMin: 0.02,
    dust: true,
    deepSpace: true,
    reducedOxygen: true,
    care: 'Return to Earth takes 3 to 6 days or longer.',
  },
  {
    id: 'mars',
    name: 'Mars base',
    summary: 'A habitat on the Martian surface, months from Earth.',
    commDelayMin: 12,
    dust: true,
    deepSpace: true,
    reducedOxygen: true,
    care: 'No return is possible: treat on site.',
  },
];

export const DEFAULT_ENVIRONMENT: EnvironmentId = 'station';

export const environmentById = (id: EnvironmentId | null | undefined): Environment =>
  ENVIRONMENTS.find((e) => e.id === id) ?? ENVIRONMENTS.find((e) => e.id === DEFAULT_ENVIRONMENT)!;

export const isEnvironmentId = (value: unknown): value is EnvironmentId => ENVIRONMENTS.some((e) => e.id === value);

const key = (username: string) => `chm.environment.${username}`;

export function loadEnvironment(username: string): EnvironmentId | null {
  if (!username) return null;
  try {
    const stored = localStorage.getItem(key(username));
    return isEnvironmentId(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function saveEnvironment(username: string, id: EnvironmentId) {
  try {
    localStorage.setItem(key(username), id);
  } catch {
    // Storage blocked: the choice still applies until the page is reloaded.
  }
}

/** One healthy/watch/act-now range that is different from the space station in some environment. */
export interface RangeDifference {
  metric: string;
  unit: string;
  station: string;
  here: string;
  why: string;
}

const below = (green: number, red: number, unit: string) => `Healthy at ${green} ${unit} or more. Act now below ${red} ${unit}.`;
const above = (green: number, red: number, unit: string) => `Healthy up to ${green} ${unit}. Act now above ${red} ${unit}.`;

/** Ranges from the ranges guide that change in this environment (empty for the space station). */
export function rangeDifferences(env: Environment): RangeDifference[] {
  const rows: RangeDifference[] = [];
  if (env.reducedOxygen)
    rows.push({
      metric: 'Blood oxygen (SpO2)',
      unit: '%',
      station: below(95, 92, '%'),
      here: below(94, 92, '%'),
      why: 'Cabin air here is kept at lower pressure with more oxygen, so blood oxygen normally reads 1 to 2 points lower.',
    });
  if (env.deepSpace)
    rows.push({
      metric: 'Radiation dose from a solar storm',
      unit: 'mSv',
      station: above(50, 250, 'mSv'),
      here: above(25, 250, 'mSv'),
      why: "Outside Earth's magnetic field there is less protection, so shelter earlier during a solar storm.",
    });
  if (env.id === 'spacecraft')
    rows.push({
      metric: 'Exercise time per day',
      unit: 'minutes',
      station: below(120, 60, 'minutes'),
      here: below(60, 30, 'minutes'),
      why: 'A capsule only has a small flywheel exercise device, so the daily target is lower.',
    });
  if (env.id === 'mars')
    rows.push({
      metric: 'Eye, nose or throat irritation after a surface walk (0 to 10)',
      unit: 'out of 10',
      station: 'Not used: there is no dust on the station.',
      here: 'Healthy up to 1. Act now at 4 or more.',
      why: 'Mars dust contains perchlorate, so irritation is acted on sooner than with Moon dust (5 or more).',
    });
  else if (env.dust)
    rows.push({
      metric: 'Eye, nose or throat irritation after a surface walk (0 to 10)',
      unit: 'out of 10',
      station: 'Not used: there is no dust on the station.',
      here: 'Healthy up to 1. Act now at 5 or more.',
      why: 'Dust comes inside after surface walks.',
    });
  return rows;
}

type Limits = Pick<Measurement, 'dangerousLow' | 'abnormalLow' | 'abnormalHigh' | 'dangerousHigh'>;

/**
 * Limits for measurements the backend tracks, where the ranges guide gives a different value for an
 * environment. The guide lists the same limits in all five environments for every measurement the
 * backend tracks today, so this table is empty. Add a row here (environment, then measurement id)
 * and every screen picks it up.
 */
const LIMIT_OVERRIDES: Partial<Record<EnvironmentId, Record<string, Partial<Limits>>>> = {};

/**
 * The measurement with this environment's limits applied. If the backend sends a "ranges" list
 * (one entry per situation: spacecraft, station, rover, moon, mars), the entry for this
 * environment is used. Otherwise the single set of limits it sends is used as is.
 */
export function withEnvironmentLimits<T extends Measurement | undefined>(measurement: T, env: EnvironmentId): T {
  if (!measurement) return measurement;
  const served = measurement.ranges?.find((range) => range.situation === env) ?? measurement.ranges?.find((range) => range.situation === DEFAULT_ENVIRONMENT);
  const fromServer: Partial<Limits> = served
    ? { dangerousLow: served.dangerousLow ?? null, abnormalLow: served.abnormalLow ?? null, abnormalHigh: served.abnormalHigh ?? null, dangerousHigh: served.dangerousHigh ?? null }
    : {};
  const override = LIMIT_OVERRIDES[env]?.[measurement.id];
  return served || override ? ({ ...measurement, ...fromServer, ...override } as T) : measurement;
}

/** Extra advice for one measurement in this environment, in plain words. */
export function environmentNotes(env: Environment, measurementId?: string): string[] {
  const id = (measurementId ?? '').toLowerCase();
  const notes: string[] = [];
  if (env.deepSpace && (!measurementId || /solar|proton|radiation|dose/.test(id)))
    notes.push("You are outside Earth's magnetic field. Go to the shelter earlier in a solar storm: the storm dose limit here is 25 mSv, not 50.");
  if (env.id === 'spacecraft' && (!measurementId || /grip|mass|muscle|bone/.test(id)))
    notes.push('The capsule only has a small flywheel exercise device. Aim for 60 minutes of exercise a day and never skip a day.');
  if (env.reducedOxygen && (!measurementId || /heart|stand|ejection|oxygen/.test(id)))
    notes.push('Cabin air here has lower pressure and more oxygen. Blood oxygen normally reads 1 to 2 points lower: 94% or more is healthy.');
  if (env.dust && (!measurementId || /ocular|retina|oct|eye|fundus|lymph|blood_cell/.test(id)))
    notes.push(
      env.id === 'mars'
        ? 'Mars dust can irritate eyes, nose and throat. Rinse after surface walks and tell the Crew Medical Officer if irritation reaches 4 out of 10.'
        : 'Surface dust can irritate eyes, nose and throat. Rinse after surface walks and tell the Crew Medical Officer if irritation reaches 5 out of 10.',
    );
  return notes;
}

/** How to reach the flight surgeon from here. A delay over 5 minutes means the crew does not wait. */
export function flightSurgeonNote(env: Environment): string {
  if (env.commDelayMin > 5)
    return `A message takes about ${Math.round(env.commDelayMin)} minutes each way from here. The Crew Medical Officer follows the onboard protocol and does not wait for a reply.`;
  if (env.commDelayMin > 0) return 'Messages reach Earth within seconds. Send the report now and mark it urgent.';
  return 'You can talk to the ground almost in real time. Send the report now and mark it urgent.';
}

export function commDelayText(env: Environment): string {
  if (env.commDelayMin === 0) return 'Almost none';
  if (env.commDelayMin < 1) {
    const seconds = Math.max(1, Math.round(env.commDelayMin * 60));
    return `About ${seconds} second${seconds === 1 ? '' : 's'} each way`;
  }
  return `About ${Math.round(env.commDelayMin)} minutes each way`;
}
