// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// One function per backend endpoint. Ids always come from the backend, never from this file.
import { api } from './client';
import type {
  BadgeSet,
  ChildOverview,
  ChildReminder,
  UserStatus,
  LogMeasurementRequest,
  Measurement,
  MeasurementSet,
  MeasurementTrend,
  Reminder,
  ReminderDigest,
  RiskEvaluation,
  RiskFactor,
} from './types';

const enc = encodeURIComponent;

/** The backend returns the token as plain text or as a JSON-quoted string; accept both. */
function parseToken(raw: unknown): string {
  const text = String(raw ?? '').trim();
  const token = text.startsWith('"') && text.endsWith('"') ? text.slice(1, -1) : text;
  if (!token) throw new Error('The server did not return a token.');
  return token;
}

const asText = { responseType: 'text' as const, transformResponse: [(data: unknown) => data] };

/** Several endpoints answer with a bare word ("mars", "normal", "null"), sometimes JSON-quoted. */
function plainText(raw: unknown): string {
  const text = String(raw ?? '').trim();
  return text.startsWith('"') && text.endsWith('"') ? text.slice(1, -1) : text;
}

export const auth = {
  /** POST /users/login creates an account. 409 means the username is taken. */
  async register(username: string, password: string): Promise<string> {
    const response = await api.post('/users/login', { username, password }, asText);
    return parseToken(response.data);
  },
  /** PUT /users/login logs in to an existing account. 401 means wrong username or password. */
  async login(username: string, password: string): Promise<string> {
    const response = await api.put('/users/login', { username, password }, asText);
    return parseToken(response.data);
  },
};

export const user = {
  getRiskScores: async () => (await api.get<RiskEvaluation[]>('/users/risks')).data,
  getRiskScore: async (riskId: string) => (await api.get<RiskEvaluation>(`/users/risks/${enc(riskId)}`)).data,
  getUpcoming: async (withinDays = 30) =>
    (await api.get<Reminder[]>('/users/upcoming', { params: { withinDays } })).data,
  /** Earned badges, and unearned ones with progress. The backend evaluates them from the history. */
  getBadges: async () => (await api.get<BadgeSet>('/users/badges')).data,
  getDigest: async () => (await api.get<ReminderDigest>('/users/digest')).data,
  getHistory: async (measurementId: string) =>
    (await api.get<MeasurementSet[]>(`/users/measurements/${enc(measurementId)}`)).data,
  getTrend: async (measurementId: string) =>
    (await api.get<MeasurementTrend>(`/users/measurements/${enc(measurementId)}/trend`)).data,
  logMeasurement: async (measurementId: string, body: LogMeasurementRequest) => {
    await api.post(`/users/measurements/${enc(measurementId)}`, body);
  },
  /**
   * DELETE removes one reading. Without an index the backend deletes the most recent one; with an
   * index it deletes that position in the newest-first list that getHistory returns (0 = newest).
   * 400 means it is the baseline reading and later readings still depend on it.
   */
  deleteMeasurement: async (measurementId: string, measurementIndex?: number) => {
    await api.delete(`/users/measurements/${enc(measurementId)}`, {
      params: measurementIndex === undefined ? undefined : { measurementIndex },
    });
  },
  setFrequency: async (measurementId: string, frequencyDays: number) => {
    await api.put(`/users/measurements/${enc(measurementId)}/frequency`, { frequencyDays });
  },
  /**
   * The medical officer's review of one of your own scans: how many checklist findings were seen.
   * Without an index it is the newest scan. 403 means you have a medical officer, who reviews for you.
   */
  setScore: async (measurementId: string, numAbnormal: number, measurementIndex?: number) => {
    await api.put(`/users/measurements/${enc(measurementId)}/score`, null, { params: measurementIndex === undefined ? { numAbnormal } : { numAbnormal, measurementIndex } });
  },
  /** spacecraft, station, rover, moon or mars. The backend scores risks with this environment's ranges. */
  getEnvironment: async () => plainText((await api.get('/users/environment', asText)).data),
  setEnvironment: async (newEnvironment: string) => {
    await api.put('/users/environment', null, { params: { newEnvironment } });
  },
  getStatus: async (): Promise<UserStatus> => (plainText((await api.get('/users/status', asText)).data).toLowerCase() === 'medical officer' ? 'medical officer' : 'normal'),
  /** 409 while you have a medical officer or assigned crew. */
  setStatus: async (newStatus: UserStatus) => {
    await api.put('/users/status', null, { params: { newStatus } });
  },
  /** Username of your medical officer, or null when you have none. */
  getOfficer: async (): Promise<string | null> => {
    const name = plainText((await api.get('/users/officer', asText)).data);
    return !name || name === 'null' ? null : name;
  },
  /** 404 unknown username; 409 if that user is not a medical officer, is you, or you are one yourself. */
  setOfficer: async (newOfficer: string) => {
    await api.put('/users/officer', null, { params: { newOfficer } });
  },
};

/** The medical officer's view of the crew assigned to them ("children" on the backend). */
export const officer = {
  getChildren: async () => (await api.get<ChildOverview[]>('/users/children')).data,
  /** Overdue checks across all assigned crew. Medical officers only (403 otherwise). */
  getOverdue: async () => (await api.get<ChildReminder[]>('/users/overdue')).data,
  getRiskScores: async (childId: string) => (await api.get<RiskEvaluation[]>(`/users/children/${enc(childId)}/risks`)).data,
  getHistory: async (childId: string, measurementId: string) =>
    (await api.get<MeasurementSet[]>(`/users/children/${enc(childId)}/measurements/${enc(measurementId)}`)).data,
  getUpcoming: async (childId: string, withinDays = 30) =>
    (await api.get<Reminder[]>(`/users/children/${enc(childId)}/upcoming`, { params: { withinDays } })).data,
  setScore: async (childId: string, measurementId: string, numAbnormal: number, measurementIndex?: number) => {
    await api.put(`/users/children/${enc(childId)}/measurements/${enc(measurementId)}/score`, null, {
      params: measurementIndex === undefined ? { numAbnormal } : { numAbnormal, measurementIndex },
    });
  },
};

export const data = {
  getRisks: async () => (await api.get<RiskFactor[]>('/data/risks')).data,
  getRisk: async (riskId: string) => (await api.get<RiskFactor>(`/data/risks/${enc(riskId)}`)).data,
  getMeasurement: async (measurementId: string): Promise<Measurement> => {
    const m = (await api.get<Measurement>(`/data/measurements/${enc(measurementId)}`)).data;
    // Works with both backend formats: one set of limits, or a "ranges" list per situation. With the
    // list, the station entry fills the single limits; lib/environment then picks the crew member's own.
    const station = m.ranges?.find((range) => range.situation === 'station') ?? m.ranges?.[0];
    return {
      ...m,
      dangerousLow: m.dangerousLow ?? station?.dangerousLow ?? null,
      abnormalLow: m.abnormalLow ?? station?.abnormalLow ?? null,
      abnormalHigh: m.abnormalHigh ?? station?.abnormalHigh ?? null,
      dangerousHigh: m.dangerousHigh ?? station?.dangerousHigh ?? null,
      instructions: m.instructions ?? [],
    };
  },
  /** The findings a medical officer looks for in a visual measurement (400 for a numerical one). */
  getFlags: async (measurementId: string) => (await api.get<string[]>(`/data/measurements/${enc(measurementId)}/flags`)).data,
};
