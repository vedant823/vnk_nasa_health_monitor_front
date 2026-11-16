// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Mock mode (VITE_USE_MOCKS=true): an in-browser stand-in for the Spring backend, so the app can be
// built and demoed without Java and MongoDB. It copies the backend's rules (scoring, baselines,
// reminders). All readings it holds are SIMULATED, not real crew data.
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import riskInfo from '../mocks/riskInfo.json';
import details from '../mocks/measurementDetails.json';
import instructions from '../mocks/measurementInstructions.json';
import badgeFile from '../mocks/badges.json';
import flagFile from '../mocks/measurementFlags.json';
import type { BadgeCriterion, BadgeRule, BadgeSet, BaselineMode, ChildOverview, ChildReminder, Measurement, MeasurementRange, MeasurementSet, Reminder, RiskEvaluation, RiskFactor, UserStatus } from './types';

const DAY = 86_400_000;
const STORE_KEY = 'chm.mock.v2';
const ENVIRONMENTS = ['spacecraft', 'station', 'rover', 'moon', 'mars'];
const DEFAULT_FREQUENCY = 7;

interface StoredSet {
  timestamp: string;
  values: number[] | null;
  images: string[] | null;
  /** Visual readings: findings counted by the medical officer. Null = not reviewed yet. */
  numAbnormal?: number | null;
}
interface MockUser {
  password: string;
  token: string;
  environment: string;
  status: UserStatus;
  /** Username of this user's medical officer (the mock uses usernames as user ids). */
  officer: string | null;
  freq: Record<string, number>;
  history: Record<string, StoredSet[]>;
  baselines: Record<string, number>;
}
type Store = Record<string, MockUser>;

const risks = (riskInfo as { risks: RiskFactor[] }).risks;

type DetailRow = Partial<Measurement> & { id: string; name: string; type: string; ranges?: MeasurementRange[] };
const stepsById = new Map(
  (instructions as { measurements: { id: string; instructions: Measurement['instructions'] }[] }).measurements.map(
    (m) => [m.id, m.instructions],
  ),
);
const measurements: Measurement[] = (details as { measurements: DetailRow[] }).measurements.map((d) => ({
  id: d.id,
  name: d.name,
  category: d.type === 'visual' ? 'visual' : 'numerical',
  unit: d.unit ?? null,
  // The backend serves only the per-environment list; the single limits are filled by api/endpoints.
  dangerousLow: null,
  abnormalLow: null,
  abnormalHigh: null,
  dangerousHigh: null,
  ranges: d.ranges ?? [],
  canBeNegative: d.canBeNegative ?? false,
  baselineMode: (d.baselineMode as BaselineMode | undefined) ?? 'none',
  lowRecommendation: d.lowRecommendation ?? null,
  highRecommendation: d.highRecommendation ?? null,
  instructions: stepsById.get(d.id) ?? [],
}));
const measurementById = new Map(measurements.map((m) => [m.id, m]));
const flagsById = new Map((flagFile as { measurements: { measurementID: string; flags: string[] }[] }).measurements.map((f) => [f.measurementID, f.flags]));

const NO_LIMITS: MeasurementRange = { situation: 'station', dangerousLow: null, abnormalLow: null, abnormalHigh: null, dangerousHigh: null };
/** The guideline range for the user's environment, as the backend's Measurement.rangeFor does. */
const limitsFor = (u: MockUser, m: Measurement): MeasurementRange =>
  m.ranges?.find((r) => r.situation === u.environment) ?? m.ranges?.find((r) => r.situation === 'station') ?? NO_LIMITS;

/**
 * A stand-in picture for seeded scans in demo mode. It is a drawing, not a real eye scan, and it
 * says so in the picture itself.
 */
const SIMULATED_SCAN =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#1b1410"/><circle cx="200" cy="150" r="128" fill="#7a3415"/><circle cx="200" cy="150" r="128" fill="none" stroke="#3a1a0c" stroke-width="6"/><circle cx="262" cy="150" r="26" fill="#f0c98a"/><circle cx="262" cy="150" r="11" fill="#fbe9c8"/><circle cx="150" cy="152" r="16" fill="#5a2410"/><g fill="none" stroke="#b9391c" stroke-width="3" stroke-linecap="round"><path d="M262 150C230 110 190 92 130 96"/><path d="M262 150C232 186 192 208 128 210"/><path d="M262 150C290 118 304 96 322 84"/><path d="M262 150C292 180 306 204 320 222"/></g><rect x="0" y="262" width="400" height="38" fill="#000" fill-opacity=".72"/><text x="200" y="287" text-anchor="middle" font-family="sans-serif" font-size="17" fill="#fff">Simulated scan. AI-generated drawing.</text></svg>',
  );

let memory: Store | null = null;
function load(): Store {
  if (memory) return memory;
  try {
    memory = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as Store;
  } catch {
    memory = {};
  }
  return memory;
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(memory));
  } catch {
    // Storage full (large photos): keep the data in memory for this session only.
  }
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const average = (values: number[] | null) =>
  values && values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

function change(u: MockUser, id: string, raw: number, mode: BaselineMode | null): number | null {
  const baseline = u.baselines[id];
  if (baseline === undefined || !mode || mode === 'none' || baseline === 0) return null;
  return mode === 'percent' ? ((raw - baseline) / Math.abs(baseline)) * 100 : raw - baseline;
}

function adjusted(u: MockUser, m: Measurement, set: StoredSet): number {
  const raw = average(set.values);
  return change(u, m.id, raw, m.baselineMode) ?? raw;
}

function evaluate(u: MockUser, risk: RiskFactor): RiskEvaluation {
  // Same rules as the backend's JudgementService, including the officer's count for visual readings.
  const dangerous: { text: string; advice: string }[] = [];
  const abnormal: { text: string; advice: string }[] = [];
  let hasVisual = false;
  for (const id of risk.measurementIds) {
    const m = measurementById.get(id);
    if (!m) continue;
    const history = u.history[id] ?? [];
    if (!history.length) continue;
    if (m.category === 'visual') {
      const count = history[history.length - 1].numAbnormal;
      if (count === null || count === undefined) hasVisual = true;
      else if (count >= 1) {
        const finding = { text: `${m.name} shows ${count} ${count === 1 ? 'abnormality' : 'abnormalities'}`, advice: `${m.name} shows abnormalities: review the flagged findings with the Crew Medical Officer.` };
        (count === 1 ? abnormal : dangerous).push(finding);
      }
      continue;
    }
    const value = adjusted(u, m, history[history.length - 1]);
    const lim = limitsFor(u, m);
    const label = `${m.name} ${value} ${m.unit ?? ''}`.trim();
    const low = m.lowRecommendation ?? `${m.name} is low: tell the Crew Medical Officer.`;
    const high = m.highRecommendation ?? `${m.name} is high: tell the Crew Medical Officer.`;
    if (lim.dangerousLow !== null && value < lim.dangerousLow) dangerous.push({ text: `${label} is in the dangerous low range`, advice: low });
    else if (lim.abnormalLow !== null && value < lim.abnormalLow) abnormal.push({ text: `${label} is below the normal range`, advice: low });
    else if (lim.dangerousHigh !== null && value > lim.dangerousHigh) dangerous.push({ text: `${label} is in the dangerous high range`, advice: high });
    else if (lim.abnormalHigh !== null && value > lim.abnormalHigh) abnormal.push({ text: `${label} is above the normal range`, advice: high });
  }
  const penalty = dangerous.length * 75 + abnormal.length * 40;
  const all = [...dangerous, ...abnormal];
  const reasons = all.map((a) => a.text);
  if (hasVisual) reasons.push('Visual measurements are not yet scored');
  return {
    riskId: risk.id,
    score: Math.max(1, 100 - penalty),
    advice: all.length ? all.map((a) => a.advice) : ['No action needed - all measurements are within the normal range.'],
    reason: reasons.length ? reasons.join('; ') : 'All measurements are within the normal range.',
  };
}

/** Same rules as the backend's BadgeService: progress per criterion, earned when every one reaches 1. */
function criterionProgress(u: MockUser, c: BadgeCriterion): number {
  const times: number[] = [];
  for (const id of c.measurementType) {
    const m = measurementById.get(id);
    if (!m) continue;
    for (const set of u.history[id] ?? []) {
      if (c.isOk) {
        if (m.category === 'visual') continue;
        const value = adjusted(u, m, set);
        const lim = limitsFor(u, m);
        const green =
          !(lim.dangerousLow !== null && value < lim.dangerousLow) &&
          !(lim.abnormalLow !== null && value < lim.abnormalLow) &&
          !(lim.abnormalHigh !== null && value > lim.abnormalHigh) &&
          !(lim.dangerousHigh !== null && value > lim.dangerousHigh);
        if (!green) continue;
      }
      times.push(Date.parse(set.timestamp));
    }
  }
  let achieved = times.length;
  if (c.streak || c.distinctDays) {
    // UTC calendar days, each counted once.
    const days = [...new Set(times.map((t) => Math.floor(t / DAY)))].sort((a, b) => a - b);
    achieved = days.length;
    if (c.streak) {
      let best = 0;
      let run = 0;
      days.forEach((day, i) => {
        run = i > 0 && day === days[i - 1] + 1 ? run + 1 : 1;
        best = Math.max(best, run);
      });
      achieved = best;
    }
  }
  return Math.min(1, achieved / c.count);
}

function evaluateBadges(u: MockUser): BadgeSet {
  const set: BadgeSet = { earned: [], unearned: [] };
  for (const badge of (badgeFile as { badges: BadgeRule[] }).badges) {
    const progress = badge.criteria.map((c) => criterionProgress(u, c));
    if (progress.every((p) => p >= 1)) set.earned.push(badge);
    else set.unearned.push({ badge, progress });
  }
  return set;
}

function upcoming(u: MockUser, withinDays: number): Reminder[] {
  const now = Date.now();
  const horizon = now + withinDays * DAY;
  const out: Reminder[] = [];
  for (const m of measurements) {
    const history = u.history[m.id] ?? [];
    const last = history.length ? Date.parse(history[history.length - 1].timestamp) : null;
    const due = last !== null ? last + (u.freq[m.id] ?? DEFAULT_FREQUENCY) * DAY : now;
    if (due <= horizon) out.push({ measurementId: m.id, dueDate: new Date(due).toISOString() });
  }
  return out.sort((a, b) => Date.parse(String(a.dueDate)) - Date.parse(String(b.dueDate)));
}

/** Simulated three weeks of readings for any mock account whose name starts with "demo". */
function seedDemo(u: MockUser) {
  const now = Date.now();
  const series: Record<string, { everyDays: number; values: number[][] }> = {
    white_blood_cells: { everyDays: 7, values: [[6400], [6100], [5800]] },
    lymphocytes: { everyDays: 7, values: [[1900], [1500], [950]] },
    body_mass_change: { everyDays: 3, values: [[75.0], [74.8], [74.5], [74.1], [73.8], [73.4], [73.1]] },
    grip_strength_change: { everyDays: 7, values: [[46], [45], [44.5]] },
    intraocular_pressure: { everyDays: 7, values: [[15, 15], [17, 16], [19, 18]] },
    retinal_thickness_change: { everyDays: 10, values: [[300], [306]] },
    stand_test_systolic_drop: { everyDays: 7, values: [[5], [7], [9]] },
    resting_heart_rate: { everyDays: 2, values: [[58], [59], [57], [60], [61], [59], [62], [60], [63], [61]] },
    ejection_fraction: { everyDays: 10, values: [[61], [60]] },
    sleep_duration: { everyDays: 3, values: [[7.6, 7.4, 7.5], [7.3, 7.1, 7.2], [7.0, 7.2, 6.9], [6.8, 6.9, 6.6], [6.6, 6.4, 6.7], [6.5, 6.6, 6.3], [6.4, 6.2, 6.5]] },
    memory_score_change: { everyDays: 7, values: [[100], [99], [98]] },
    balance_score_change: { everyDays: 7, values: [[100], [98], [97]] },
    mood_score: { everyDays: 1, values: Array.from({ length: 12 }, (_, i) => [[8, 8, 7, 8, 9, 8, 7, 7, 8, 8, 7, 8][i]]) },
    solar_proton_flux: { everyDays: 2, values: [[1], [1], [2], [1], [3], [1], [1], [2], [1], [1]] },
  };
  for (const [id, s] of Object.entries(series)) {
    const m = measurementById.get(id);
    if (!m) continue;
    const n = s.values.length;
    u.history[id] = s.values.map((values, i) => ({
      // Space readings so the newest is 1 hour old for daily checks, older for the rest.
      timestamp: new Date(now - (n - 1 - i) * s.everyDays * DAY - (s.everyDays === 1 ? 20 * 3_600_000 : 3 * 3_600_000)).toISOString(),
      values,
      images: null,
    }));
    if (m.baselineMode && m.baselineMode !== 'none') u.baselines[id] = average(s.values[0]);
    u.freq[id] = s.everyDays;
  }
  // One eye scan waiting for a medical officer's review.
  u.history.oct_fundus_scan = [{ timestamp: new Date(now - 26 * 3_600_000).toISOString(), values: null, images: [SIMULATED_SCAN], numAbnormal: null }];
  u.freq.oct_fundus_scan = 14;
}

function newUser(password: string): MockUser {
  const u: MockUser = { password, token: crypto.randomUUID(), environment: 'station', status: 'normal', officer: null, freq: {}, history: {}, baselines: {} };
  for (const m of measurements) u.freq[m.id] = DEFAULT_FREQUENCY;
  return u;
}

/** Requests about one user's health data. Used for the signed-in user and, read-only plus scoring, for an officer's crew. */
function healthData(u: MockUser, username: string, scorer: MockUser, rest: string[], method: string, body: Record<string, unknown>, params: Record<string, unknown>, asOfficer: boolean): unknown {
  if (rest[0] === 'risks' && rest.length === 1) return risks.map((r) => evaluate(u, r));
  if (rest[0] === 'risks') {
    const risk = risks.find((r) => r.id === rest[1]);
    if (!risk) throw new HttpError(404, 'Unknown risk');
    return evaluate(u, risk);
  }
  if (rest[0] === 'upcoming') return upcoming(u, Number(params.withinDays ?? 30));
  if (rest[0] === 'measurements') {
    const m = measurementById.get(rest[1]);
    if (!m) throw new HttpError(404, 'Unknown measurement');
    const history = u.history[m.id] ?? [];
    if (rest[2] === 'score' && method === 'put') {
      if (scorer.officer) throw new HttpError(403, 'Only users without an officer can judge images; ask your officer');
      if (m.category !== 'visual') throw new HttpError(400, 'Only visual measurements can be scored');
      const count = Number(params.numAbnormal);
      if (!Number.isInteger(count) || count < 0) throw new HttpError(400, 'numAbnormal cannot be negative');
      if (!history.length) throw new HttpError(404, `No readings logged for ${m.id}`);
      const index = params.measurementIndex === undefined ? 0 : Number(params.measurementIndex);
      if (!Number.isInteger(index) || index < 0 || index >= history.length) throw new HttpError(404, 'Invalid measurement index');
      history[history.length - 1 - index].numAbnormal = count;
      save();
      return '';
    }
    if (!asOfficer) {
      if (rest[2] === 'frequency' && method === 'put') {
        const days = Number(body.frequencyDays);
        if (!Number.isInteger(days) || days < 1) throw new HttpError(400, 'frequencyDays must be 1 or more');
        u.freq[m.id] = days;
        save();
        return '';
      }
      if (rest[2] === 'trend') {
        if (history.length < 2) return { measurementId: m.id, direction: null };
        const previous = adjusted(u, m, history[history.length - 2]);
        const latest = adjusted(u, m, history[history.length - 1]);
        const flat = Math.abs(latest - previous) <= 0.005 * Math.max(Math.abs(previous), Math.abs(latest));
        return { measurementId: m.id, direction: flat ? 'flat' : latest > previous ? 'up' : 'down' };
      }
      if (method === 'post') {
        let values: number[] | null = null;
        let images: string[] | null = null;
        if (m.category === 'numerical') {
          const list = body.values as unknown;
          if (!Array.isArray(list) || !list.length) throw new HttpError(400, "Numerical measurement requires a 'values' list");
          for (const v of list) {
            if (typeof v !== 'number' || !Number.isFinite(v)) throw new HttpError(400, 'Values must be finite numbers');
            if (!m.canBeNegative && v < 0) throw new HttpError(400, 'This measurement cannot be negative');
          }
          values = list as number[];
          if (m.baselineMode && m.baselineMode !== 'none' && u.baselines[m.id] === undefined) u.baselines[m.id] = average(values);
        } else {
          if (typeof body.image !== 'string' || !body.image.trim()) throw new HttpError(400, "Visual measurement requires an 'image'");
          images = [body.image];
        }
        // Demo mode only: guest mode may pass an earlier time so its starting readings are spread
        // over a few weeks. The real backend stamps every reading with the time it arrives.
        const when = typeof body.timestamp === 'string' && !Number.isNaN(Date.parse(body.timestamp)) ? body.timestamp : new Date().toISOString();
        const list = (u.history[m.id] ??= []);
        list.push({ timestamp: when, values, images, numAbnormal: null });
        list.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
        save();
        return '';
      }
      if (method === 'delete') {
        // Same rules as the backend: index counts from the newest reading; the baseline reading
        // (the first one) can only go when it is the last reading left.
        if (!history.length) throw new HttpError(404, `No readings logged for ${m.id}`);
        const index = params.measurementIndex === undefined ? 0 : Number(params.measurementIndex);
        if (!Number.isInteger(index) || index < 0 || index >= history.length) throw new HttpError(404, 'Invalid measurement index');
        const position = history.length - 1 - index;
        const baselineRelative = m.category === 'numerical' && !!m.baselineMode && m.baselineMode !== 'none';
        if (baselineRelative && position === 0) {
          if (history.length > 1) throw new HttpError(400, 'The baseline reading cannot be deleted while other readings exist');
          delete u.baselines[m.id];
        }
        history.splice(position, 1);
        if (!history.length) delete u.history[m.id];
        save();
        return '';
      }
    }
    if (method !== 'get') throw new HttpError(404, 'Not found');
    // GET history: newest first, baseline-adjusted.
    return [...history].reverse().map<MeasurementSet>((set) => ({
      measurementId: m.id,
      userId: username,
      timestamp: set.timestamp,
      values: set.values ? set.values.map((raw) => change(u, m.id, raw, m.baselineMode) ?? raw) : null,
      images: set.images,
      numAbnormal: set.numAbnormal ?? null,
    }));
  }
  throw new HttpError(404, 'Not found');
}

function route(method: string, path: string, body: Record<string, unknown>, params: Record<string, unknown>, authHeader: string | undefined): unknown {
  const store = load();
  const seg = path.split('/').filter(Boolean).map(decodeURIComponent);

  if (seg[0] === 'data') {
    if (seg[1] === 'risks' && seg.length === 2) return risks;
    if (seg[1] === 'risks') {
      const risk = risks.find((r) => r.id === seg[2]);
      if (!risk) throw new HttpError(404, 'Unknown risk');
      return risk;
    }
    if (seg[1] === 'measurements') {
      const m = measurementById.get(seg[2]);
      if (!m) throw new HttpError(404, 'Unknown measurement');
      if (seg[3] === 'flags') {
        if (m.category !== 'visual') throw new HttpError(400, `Measurement ${m.id} is not a visual measurement`);
        return flagsById.get(m.id) ?? [];
      }
      return m;
    }
  }

  if (seg[0] === 'users' && seg[1] === 'login') {
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    if (!username || !password) throw new HttpError(400, 'Username and password are required');
    if (method === 'post') {
      if (store[username]) throw new HttpError(409, 'Username already taken');
      const u = newUser(password);
      const lower = username.toLowerCase();
      if (lower.startsWith('demo')) seedDemo(u);
      if (lower.startsWith('cmo')) {
        // Demo medical officer: comes with two simulated crew members already assigned.
        u.status = 'medical officer';
        ['crew-ada', 'crew-ben'].forEach((suffix, i) => {
          const crewName = `${username}-${suffix}`;
          if (store[crewName]) return;
          const crew = newUser('demo');
          seedDemo(crew);
          crew.officer = username;
          crew.environment = i === 0 ? 'moon' : 'mars';
          if (i === 1) {
            // The second crew member is behind on checks and has one reading in the act-now range.
            for (const sets of Object.values(crew.history)) for (const set of sets) set.timestamp = new Date(Date.parse(set.timestamp) - 5 * DAY).toISOString();
            crew.history.resting_heart_rate.push({ timestamp: new Date(Date.now() - 2 * DAY).toISOString(), values: [128], images: null });
          }
          store[crewName] = crew;
        });
      }
      store[username] = u;
      save();
      return u.token;
    }
    const u = store[username];
    if (!u || u.password !== password) throw new HttpError(401, 'Invalid username or password');
    return u.token;
  }

  if (seg[0] === 'users') {
    if (!authHeader) throw new HttpError(400, 'Missing Authorization header');
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const entry = Object.entries(store).find(([, v]) => v.token === token);
    if (!entry) throw new HttpError(401, 'Invalid token');
    const [username, u] = entry;
    const crewOf = (officerName: string) => Object.entries(store).filter(([, v]) => v.officer === officerName);
    const lastTaken = (v: MockUser) => {
      const times = Object.values(v.history).flatMap((sets) => sets.map((set) => Date.parse(set.timestamp)));
      return times.length ? new Date(Math.max(...times)).toISOString() : null;
    };

    if (seg[1] === 'environment') {
      if (method === 'put') {
        const next = String(params.newEnvironment ?? '').toLowerCase();
        if (!ENVIRONMENTS.includes(next)) throw new HttpError(400, `Unknown environment: ${String(params.newEnvironment)}`);
        u.environment = next;
        save();
        return '';
      }
      return u.environment;
    }
    if (seg[1] === 'status') {
      if (method === 'put') {
        const next = String(params.newStatus ?? '').trim().toLowerCase();
        if (next !== 'normal' && next !== 'medical officer') throw new HttpError(400, `Unknown status: ${String(params.newStatus)}`);
        if (u.officer || crewOf(username).length) throw new HttpError(409, 'The status cannot change while the user has an officer or children');
        u.status = next;
        save();
        return '';
      }
      return u.status;
    }
    if (seg[1] === 'officer') {
      if (method === 'put') {
        const name = String(params.newOfficer ?? '').trim();
        if (!name) throw new HttpError(400, 'An officer username is required');
        const target = store[name];
        if (!target) throw new HttpError(404, `Unknown officer: ${name}`);
        if (name === username) throw new HttpError(409, 'A user cannot be their own officer');
        if (u.status === 'medical officer' || target.officer) throw new HttpError(409, 'Officers cannot have an officer');
        if (target.status !== 'medical officer') throw new HttpError(409, `Only medical officers can take children: ${name} is a normal user`);
        u.officer = name;
        save();
        return '';
      }
      return u.officer ?? 'null';
    }
    if (seg[1] === 'children' && seg.length === 2) {
      return crewOf(username).map<ChildOverview>(([name, v]) => ({ userId: name, username: name, latestMeasurement: lastTaken(v) }));
    }
    if (seg[1] === 'children') {
      const child = store[seg[2]];
      if (!child) throw new HttpError(404, `Unknown child: ${seg[2]}`);
      if (child.officer !== username) throw new HttpError(403, 'This user is not your child');
      return healthData(child, seg[2], u, seg.slice(3), method, body, params, true);
    }
    if (seg[1] === 'overdue') {
      if (u.status !== 'medical officer') throw new HttpError(403, 'Only officers can list overdue measurements');
      const now = Date.now();
      return crewOf(username)
        .flatMap(([name, v]) => upcoming(v, 0).filter((r) => Date.parse(String(r.dueDate)) <= now).map<ChildReminder>((r) => ({ childId: name, measurementId: r.measurementId, dueDate: r.dueDate })))
        .sort((a, b) => Date.parse(String(a.dueDate)) - Date.parse(String(b.dueDate)));
    }
    if (seg[1] === 'badges') return evaluateBadges(u);
    if (seg[1] === 'digest') {
      const monthly = upcoming(u, 30);
      const within = (days: number) => monthly.filter((r) => Date.parse(String(r.dueDate)) <= Date.now() + days * DAY);
      return { username, daily: within(1), weekly: within(7), monthly };
    }
    return healthData(u, username, u, seg.slice(1), method, body, params, false);
  }
  throw new HttpError(404, 'Not found');
}

export const mockAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const method = (config.method ?? 'get').toLowerCase();
  let body: Record<string, unknown> = {};
  if (typeof config.data === 'string' && config.data) {
    try {
      body = JSON.parse(config.data) as Record<string, unknown>;
    } catch {
      body = {};
    }
  } else if (config.data && typeof config.data === 'object') {
    body = config.data as Record<string, unknown>;
  }
  const authHeader = config.headers?.get?.('Authorization');
  const respond = (status: number, data: unknown): AxiosResponse => ({
    data: config.responseType === 'text' && typeof data !== 'string' ? JSON.stringify(data) : data,
    status,
    statusText: String(status),
    headers: {},
    config,
  });
  try {
    const result = route(method, config.url ?? '', body, (config.params ?? {}) as Record<string, unknown>, typeof authHeader === 'string' ? authHeader : undefined);
    return respond(200, result);
  } catch (error) {
    if (error instanceof HttpError) {
      const response = respond(error.status, error.message);
      throw new AxiosError(error.message, String(error.status), config, undefined, response);
    }
    throw error;
  }
};
