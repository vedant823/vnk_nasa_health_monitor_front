// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// One function per backend endpoint. Ids always come from the backend, never from this file.
import { api } from './client';
import type {
  BadgeSet,
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
};
