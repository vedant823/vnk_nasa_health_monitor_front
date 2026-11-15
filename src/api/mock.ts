// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Mock mode (VITE_USE_MOCKS=true): an in-browser stand-in for the Spring backend, so the app can be
// built and demoed without Java and MongoDB. It copies the backend's rules (scoring, baselines,
// reminders). All readings it holds are SIMULATED, not real crew data.
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import riskInfo from '../mocks/riskInfo.json';
import details from '../mocks/measurementDetails.json';
import instructions from '../mocks/measurementInstructions.json';
import type { BaselineMode, Measurement, MeasurementSet, Reminder, RiskEvaluation, RiskFactor } from './types';

const DAY = 86_400_000;
const STORE_KEY = 'chm.mock.v1';
const DEFAULT_FREQUENCY = 7;

interface StoredSet {
  timestamp: string;
  values: number[] | null;
  images: string[] | null;
}
interface MockUser {
  password: string;
  token: string;
  freq: Record<string, number>;
  history: Record<string, StoredSet[]>;
  baselines: Record<string, number>;
}
type Store = Record<string, MockUser>;

const risks = (riskInfo as { risks: RiskFactor[] }).risks;

type DetailRow = Partial<Measurement> & { id: string; name: string; type: string };
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
  dangerousLow: d.dangerousLow ?? null,
  abnormalLow: d.abnormalLow ?? null,
  abnormalHigh: d.abnormalHigh ?? null,
  dangerousHigh: d.dangerousHigh ?? null,
  canBeNegative: d.canBeNegative ?? false,
  baselineMode: (d.baselineMode as BaselineMode | undefined) ?? 'none',
  lowRecommendation: d.lowRecommendation ?? null,
  highRecommendation: d.highRecommendation ?? null,
  instructions: stepsById.get(d.id) ?? [],
}));
const measurementById = new Map(measurements.map((m) => [m.id, m]));

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
  const dangerous: { text: string; advice: string }[] = [];
  const abnormal: { text: string; advice: string }[] = [];
  let hasVisual = false;
  for (const id of risk.measurementIds) {
    const m = measurementById.get(id);
    if (!m) continue;
    if (m.category === 'visual') {
      hasVisual = true;
      continue;
    }
    const history = u.history[id] ?? [];
    if (!history.length) continue;
    const value = adjusted(u, m, history[history.length - 1]);
    const label = `${m.name} ${value} ${m.unit ?? ''}`.trim();
    const low = m.lowRecommendation ?? `${m.name} is low: tell the Crew Medical Officer.`;
    const high = m.highRecommendation ?? `${m.name} is high: tell the Crew Medical Officer.`;
    if (m.dangerousLow !== null && value < m.dangerousLow) dangerous.push({ text: `${label} is in the dangerous low range`, advice: low });
    else if (m.abnormalLow !== null && value < m.abnormalLow) abnormal.push({ text: `${label} is below the normal range`, advice: low });
    else if (m.dangerousHigh !== null && value > m.dangerousHigh) dangerous.push({ text: `${label} is in the dangerous high range`, advice: high });
    else if (m.abnormalHigh !== null && value > m.abnormalHigh) abnormal.push({ text: `${label} is above the normal range`, advice: high });
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
      return m;
    }
  }

  if (seg[0] === 'users' && seg[1] === 'login') {
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    if (!username || !password) throw new HttpError(400, 'Username and password are required');
    if (method === 'post') {
      if (store[username]) throw new HttpError(409, 'Username already taken');
      const u: MockUser = { password, token: crypto.randomUUID(), freq: {}, history: {}, baselines: {} };
      for (const m of measurements) u.freq[m.id] = DEFAULT_FREQUENCY;
      if (username.toLowerCase().startsWith('demo')) seedDemo(u);
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

    if (seg[1] === 'risks' && seg.length === 2) return risks.map((r) => evaluate(u, r));
    if (seg[1] === 'risks') {
      const risk = risks.find((r) => r.id === seg[2]);
      if (!risk) throw new HttpError(404, 'Unknown risk');
      return evaluate(u, risk);
    }
    if (seg[1] === 'upcoming') return upcoming(u, Number(params.withinDays ?? 30));
    if (seg[1] === 'digest') {
      const monthly = upcoming(u, 30);
      const within = (days: number) => monthly.filter((r) => Date.parse(String(r.dueDate)) <= Date.now() + days * DAY);
      return { username, daily: within(1), weekly: within(7), monthly };
    }
    if (seg[1] === 'measurements') {
      const m = measurementById.get(seg[2]);
      if (!m) throw new HttpError(404, 'Unknown measurement');
      const history = u.history[m.id] ?? [];
      if (seg[3] === 'frequency' && method === 'put') {
        const days = Number(body.frequencyDays);
        if (!Number.isInteger(days) || days < 1) throw new HttpError(400, 'frequencyDays must be 1 or more');
        u.freq[m.id] = days;
        save();
        return '';
      }
      if (seg[3] === 'trend') {
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
        (u.history[m.id] ??= []).push({ timestamp: new Date().toISOString(), values, images });
        save();
        return '';
      }
      // GET history: newest first, baseline-adjusted.
      return [...history].reverse().map<MeasurementSet>((set) => ({
        measurementId: m.id,
        userId: username,
        timestamp: set.timestamp,
        values: set.values ? set.values.map((raw) => change(u, m.id, raw, m.baselineMode) ?? raw) : null,
        images: set.images,
      }));
    }
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
