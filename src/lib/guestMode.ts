// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Guest mode: a ready-made demo crew that anyone can look at without making an account. It is the
// medical officer "testOfficer" and the crew assigned to them (at least three), all made and filled
// through the backend's normal endpoints (no backend changes). The readings are invented but
// realistic, so the app looks like a crew a few weeks into a mission.
//
// The demo accounts share one password, written below on purpose: they are public demo accounts
// that hold no real data. Anyone who knows it can log in to them, which is the point of guest mode.
// Set VITE_GUEST_PASSWORD to use another one.
import { api, USE_MOCKS } from '../api/client';
import { auth } from '../api/endpoints';
import type { EnvironmentId } from './environment';

export const GUEST_PASSWORD = (import.meta.env.VITE_GUEST_PASSWORD as string | undefined) || 'testingOfficer456';
/** Password of the officer's existing crew accounts, when it differs from the officer's. */
export const GUEST_CREW_PASSWORD = (import.meta.env.VITE_GUEST_CREW_PASSWORD as string | undefined) || GUEST_PASSWORD;
export const GUEST_OFFICER = 'testOfficer';
const GUEST_KEY = 'chm.guest';
const ROSTER_KEY = 'chm.guest.roster';

type Series = { everyDays: number; values: number[][] };

export interface GuestAccount {
  username: string;
  role: 'officer' | 'crew';
  /** Shown in the account switcher. */
  label: string;
  /** One line on what this account shows off. */
  story: string;
  environment: EnvironmentId;
  readings: Record<string, Series>;
  /** Adds one eye scan that waits for the medical officer's review. */
  scan: boolean;
}

const daily = (values: number[]) => ({ everyDays: 1, values: values.map((v) => [v]) });

export const GUEST_ACCOUNTS: GuestAccount[] = [
  {
    username: GUEST_OFFICER,
    role: 'officer',
    label: 'testOfficer (Crew Medical Officer)',
    story: 'The medical officer. Open Crew to see everyone, their overdue checks and the scans waiting for review.',
    environment: 'station',
    scan: false,
    readings: {
      white_blood_cells: { everyDays: 7, values: [[6900], [7100], [6800]] },
      lymphocytes: { everyDays: 7, values: [[2100], [2000], [2050]] },
      body_mass_change: { everyDays: 4, values: [[81.2], [81.0], [80.9], [80.7], [80.8]] },
      resting_heart_rate: { everyDays: 2, values: [[62], [60], [61], [63], [59], [61], [60]] },
      sleep_duration: { everyDays: 3, values: [[7.4, 7.6, 7.2], [7.5, 7.3, 7.7], [7.2, 7.4, 7.5]] },
      mood_score: daily([8, 8, 9, 8, 7, 8, 9]),
      solar_proton_flux: { everyDays: 2, values: [[1], [2], [1], [1], [2]] },
    },
  },
  {
    username: 'testCrewAva',
    role: 'crew',
    label: 'testCrewAva (Moon base)',
    story: 'Mostly healthy. Sleep has been slipping for a week and one eye scan is waiting for review.',
    environment: 'moon',
    scan: true,
    readings: {
      white_blood_cells: { everyDays: 7, values: [[6200], [6000], [6300]] },
      lymphocytes: { everyDays: 7, values: [[1800], [1700], [1750]] },
      body_mass_change: { everyDays: 3, values: [[64.0], [63.9], [63.7], [63.8], [63.6], [63.5]] },
      grip_strength_change: { everyDays: 7, values: [[38], [37.5], [37]] },
      intraocular_pressure: { everyDays: 7, values: [[14, 15], [15, 15], [16, 15]] },
      retinal_thickness_change: { everyDays: 10, values: [[292], [295]] },
      stand_test_systolic_drop: { everyDays: 7, values: [[4], [6], [5]] },
      resting_heart_rate: { everyDays: 2, values: [[57], [58], [56], [59], [58], [60], [58]] },
      ejection_fraction: { everyDays: 10, values: [[63], [62]] },
      sleep_duration: { everyDays: 3, values: [[7.5, 7.3, 7.6], [7.1, 7.0, 7.2], [6.9, 6.7, 7.0], [6.6, 6.8, 6.5]] },
      memory_score_change: { everyDays: 7, values: [[100], [101], [99]] },
      balance_score_change: { everyDays: 7, values: [[100], [99], [98]] },
      mood_score: daily([8, 7, 8, 7, 7, 6, 7]),
      solar_proton_flux: { everyDays: 2, values: [[1], [1], [3], [2], [1]] },
    },
  },
  {
    username: 'testCrewBen',
    role: 'crew',
    label: 'testCrewBen (Space station)',
    story: 'Losing weight and muscle, with a low lymphocyte count: several risks to watch.',
    environment: 'station',
    scan: true,
    readings: {
      white_blood_cells: { everyDays: 7, values: [[6400], [5900], [5300]] },
      lymphocytes: { everyDays: 7, values: [[1600], [1200], [940]] },
      body_mass_change: { everyDays: 3, values: [[76.0], [75.6], [75.1], [74.8], [74.4], [74.1]] },
      grip_strength_change: { everyDays: 7, values: [[48], [46], [44.8]] },
      intraocular_pressure: { everyDays: 7, values: [[16, 16], [17, 17], [18, 17]] },
      retinal_thickness_change: { everyDays: 10, values: [[305], [311]] },
      stand_test_systolic_drop: { everyDays: 7, values: [[6], [8], [11]] },
      resting_heart_rate: { everyDays: 2, values: [[64], [66], [65], [68], [67], [70]] },
      ejection_fraction: { everyDays: 10, values: [[58], [57]] },
      sleep_duration: { everyDays: 3, values: [[7.0, 7.2, 7.1], [7.3, 7.0, 7.2], [7.1, 7.4, 7.0]] },
      memory_score_change: { everyDays: 7, values: [[100], [98], [97]] },
      balance_score_change: { everyDays: 7, values: [[100], [97], [96]] },
      mood_score: daily([7, 7, 6, 7, 6, 7, 6]),
      solar_proton_flux: { everyDays: 2, values: [[1], [2], [1], [1]] },
    },
  },
  {
    username: 'testCrewCai',
    role: 'crew',
    label: 'testCrewCai (Mars base)',
    story: 'Resting heart rate has climbed into the act-now range and eye pressure is rising.',
    environment: 'mars',
    scan: false,
    readings: {
      white_blood_cells: { everyDays: 7, values: [[7200], [7600], [8100]] },
      lymphocytes: { everyDays: 7, values: [[2300], [2200], [2100]] },
      body_mass_change: { everyDays: 3, values: [[70.5], [70.6], [70.3], [70.4], [70.2]] },
      grip_strength_change: { everyDays: 7, values: [[42], [42.5], [41.8]] },
      intraocular_pressure: { everyDays: 7, values: [[17, 18], [20, 19], [22, 21]] },
      retinal_thickness_change: { everyDays: 10, values: [[298], [310]] },
      stand_test_systolic_drop: { everyDays: 7, values: [[7], [12], [15]] },
      resting_heart_rate: { everyDays: 2, values: [[72], [78], [86], [94], [103], [112], [124]] },
      ejection_fraction: { everyDays: 10, values: [[60], [56]] },
      sleep_duration: { everyDays: 3, values: [[6.8, 7.0, 6.9], [6.5, 6.7, 6.4], [6.4, 6.2, 6.6]] },
      memory_score_change: { everyDays: 7, values: [[100], [96], [94]] },
      balance_score_change: { everyDays: 7, values: [[100], [98], [95]] },
      mood_score: daily([7, 6, 6, 5, 6, 5, 6]),
      solar_proton_flux: { everyDays: 2, values: [[2], [3], [2], [4], [3]] },
    },
  },
];

/** One account the guest can switch to. Crew accounts take their starting data from a profile. */
export interface RosterEntry {
  username: string;
  role: 'officer' | 'crew';
  label: string;
  /** Index into GUEST_ACCOUNTS: the profile used for starting readings and the story line. */
  profile: number;
}

const OFFICER_PROFILE = 0;
const CREW_PROFILES = [1, 2, 3];

export function loadRoster(): RosterEntry[] {
  try {
    const list = JSON.parse(localStorage.getItem(ROSTER_KEY) ?? '[]') as RosterEntry[];
    if (Array.isArray(list) && list.length) return list;
  } catch {
    // Fall through to the default.
  }
  return [{ username: GUEST_OFFICER, role: 'officer', label: GUEST_ACCOUNTS[OFFICER_PROFILE].label, profile: OFFICER_PROFILE }];
}
function saveRoster(list: RosterEntry[]) {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(list));
  } catch {
    // Storage blocked.
  }
}
export const rosterEntry = (username: string) => loadRoster().find((e) => e.username.toLowerCase() === username.toLowerCase());
export const profileOf = (entry: RosterEntry) => GUEST_ACCOUNTS[entry.profile] ?? GUEST_ACCOUNTS[CREW_PROFILES[0]];
export const passwordOf = (entry: Pick<RosterEntry, 'role'>) => (entry.role === 'officer' ? GUEST_PASSWORD : GUEST_CREW_PASSWORD);

/** True while this browser is in guest mode. */
export function isGuest(): boolean {
  try {
    return localStorage.getItem(GUEST_KEY) === '1';
  } catch {
    return false;
  }
}
export function setGuest(on: boolean) {
  try {
    if (on) localStorage.setItem(GUEST_KEY, '1');
    else {
      localStorage.removeItem(GUEST_KEY);
      localStorage.removeItem(ROSTER_KEY);
    }
  } catch {
    // Storage blocked: guest mode lasts until the page is reloaded.
  }
}

const bearer = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });
const plain = (raw: unknown) => String(raw ?? '').trim().replace(/^"|"$/g, '');
const asText = { responseType: 'text' as const, transformResponse: [(d: unknown) => d] };
const statusOf = (e: unknown) => (e as { response?: { status?: number } }).response?.status;

async function tryLogin(username: string, password: string): Promise<string | null> {
  try {
    return await auth.login(username, password);
  } catch (e) {
    if (statusOf(e) === 401) return null;
    throw e;
  }
}

/** Logs in to a demo account, or creates it when it does not exist yet. */
async function loginOrCreate(username: string, password: string): Promise<{ token: string; created: boolean }> {
  const token = await tryLogin(username, password);
  if (token) return { token, created: false };
  try {
    return { token: await auth.register(username, password), created: true };
  } catch (e) {
    if (statusOf(e) === 409) throw new Error(`The account ${username} exists with a different password, so guest mode cannot open it.`);
    throw e;
  }
}

/** Every measurement the backend knows, taken from the risk list. */
async function measurementIds(): Promise<string[]> {
  const risks = (await api.get<{ measurementIds: string[] }[]>('/data/risks')).data;
  return [...new Set(risks.flatMap((r) => r.measurementIds))];
}

/**
 * A stand-in eye scan, drawn on a canvas and saved as a JPEG (the backend stores JPEG). It is an
 * AI-generated drawing and says so inside the picture.
 */
function simulatedScan(variant: number): string {
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 360;
  const g = c.getContext('2d');
  if (!g) return '';
  g.fillStyle = '#140d0a';
  g.fillRect(0, 0, 480, 360);
  const grad = g.createRadialGradient(240, 170, 20, 240, 170, 160);
  grad.addColorStop(0, '#b8501f');
  grad.addColorStop(1, '#5e230d');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(240, 170, 150, 0, Math.PI * 2);
  g.fill();
  const flip = variant % 2 ? -1 : 1;
  const discX = flip < 0 ? 170 : 310;
  g.fillStyle = '#f2cf92';
  g.beginPath();
  g.arc(discX, 165, 28, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#9e2a14';
  g.lineWidth = 3;
  g.lineCap = 'round';
  for (const [dx, dy] of [[-120, -70], [-130, 50], [80, -90], [70, 95]]) {
    g.beginPath();
    g.moveTo(discX, 165);
    g.quadraticCurveTo(discX + dx * 0.4 * flip, 165 + dy * 0.9, discX + dx * flip, 165 + dy);
    g.stroke();
  }
  g.fillStyle = '#4a1a0a';
  g.beginPath();
  g.arc(flip < 0 ? 300 : 190, 172, 16, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(0,0,0,0.75)';
  g.fillRect(0, 316, 480, 44);
  g.fillStyle = '#ffffff';
  g.font = '18px sans-serif';
  g.textAlign = 'center';
  g.fillText('Simulated scan. AI-generated drawing.', 240, 344);
  return c.toDataURL('image/jpeg', 0.85);
}

/** Logs a profile's starting readings, oldest first. */
async function seed(profile: GuestAccount, token: string) {
  const now = Date.now();
  const DAY = 86_400_000;
  for (const [id, s] of Object.entries(profile.readings)) {
    const n = s.values.length;
    for (let i = 0; i < n; i++) {
      // The backend stamps each reading with the time it arrives. Demo mode keeps the spacing.
      const body: Record<string, unknown> = { values: s.values[i] };
      if (USE_MOCKS) body.timestamp = new Date(now - (n - 1 - i) * s.everyDays * DAY - 3 * 3_600_000).toISOString();
      await api.post(`/users/measurements/${encodeURIComponent(id)}`, body, bearer(token));
    }
  }
  if (profile.scan) {
    const body: Record<string, unknown> = { image: simulatedScan(profile.username.length) };
    if (USE_MOCKS) body.timestamp = new Date(now - 26 * 3_600_000).toISOString();
    await api.post('/users/measurements/oct_fundus_scan', body, bearer(token));
  }
}

/** Removes every reading this account has, newest first (the baseline reading goes last). */
async function wipe(token: string, ids: string[]) {
  for (const id of ids) {
    const history = (await api.get<unknown[]>(`/users/measurements/${encodeURIComponent(id)}`, bearer(token))).data ?? [];
    for (let i = 0; i < history.length; i++) await api.delete(`/users/measurements/${encodeURIComponent(id)}`, bearer(token));
  }
}

/** The environment is already set for demo accounts, so the first-run question is skipped. */
function markEnvironmentChosen(username: string, environment: string) {
  try {
    localStorage.setItem(`chm.environment.${username}`, environment);
  } catch {
    // Storage blocked.
  }
}

/** Forgets what this browser remembers about an account: edits, alerts, frequencies, badges seen. */
function clearLocal(username: string) {
  try {
    const drop: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? '';
      if (/^chm\.(changes|alerts|frequency|badges|prompt)/.test(key) && key.includes(username)) drop.push(key);
    }
    drop.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage blocked: nothing to clear.
  }
}

async function hasReadings(token: string): Promise<boolean> {
  for (const id of ['resting_heart_rate', 'mood_score', 'white_blood_cells']) {
    const history = (await api.get<unknown[]>(`/users/measurements/${id}`, bearer(token))).data ?? [];
    if (history.length) return true;
  }
  return false;
}

const getEnvironment = async (token: string) => plain((await api.get('/users/environment', { ...asText, ...bearer(token) })).data);
const setEnvironment = (token: string, environment: string) => api.put('/users/environment', null, { params: { newEnvironment: environment }, ...bearer(token) });

async function makeOfficer(token: string) {
  const status = plain((await api.get('/users/status', { ...asText, ...bearer(token) })).data).toLowerCase();
  if (status !== 'medical officer') await api.put('/users/status', null, { params: { newStatus: 'medical officer' }, ...bearer(token) });
}
async function joinOfficer(token: string) {
  const current = plain((await api.get('/users/officer', { ...asText, ...bearer(token) })).data);
  if (!current || current === 'null') await api.put('/users/officer', null, { params: { newOfficer: GUEST_OFFICER }, ...bearer(token) });
}

/**
 * Opens the demo crew. Logs in as testOfficer (creating it only if it does not exist), finds the
 * crew already assigned to it that guest mode can log in to, and adds demo crew members until
 * there are at least three. Accounts with no readings get realistic starting readings; accounts
 * that already have readings are left as they are. Returns the officer's token.
 */
export async function prepareGuestAccounts(onStep: (text: string) => void): Promise<string> {
  onStep(`Opening ${GUEST_OFFICER}…`);
  const officerProfile = GUEST_ACCOUNTS[OFFICER_PROFILE];
  const officer = await loginOrCreate(GUEST_OFFICER, GUEST_PASSWORD);
  if (officer.created) await setEnvironment(officer.token, officerProfile.environment);
  await makeOfficer(officer.token);
  if (!(await hasReadings(officer.token))) {
    onStep(`Logging starting readings for ${GUEST_OFFICER}…`);
    await seed(officerProfile, officer.token);
  }
  markEnvironmentChosen(GUEST_OFFICER, await getEnvironment(officer.token));
  const roster: RosterEntry[] = [{ username: GUEST_OFFICER, role: 'officer', label: officerProfile.label, profile: OFFICER_PROFILE }];

  // Crew already assigned to the officer, as far as guest mode knows their password.
  onStep('Finding the crew…');
  const children = (await api.get<{ username: string; latestMeasurement: string | null }[]>('/users/children', bearer(officer.token))).data ?? [];
  const usable: { username: string; token: string; hasData: boolean }[] = [];
  for (const child of children) {
    const token = await tryLogin(child.username, GUEST_CREW_PASSWORD);
    if (token) usable.push({ username: child.username, token, hasData: !!child.latestMeasurement });
  }
  // Fewer than three: add the demo crew members guest mode brings along.
  for (const index of CREW_PROFILES) {
    if (usable.length >= 3) break;
    const profile = GUEST_ACCOUNTS[index];
    if (usable.some((u) => u.username.toLowerCase() === profile.username.toLowerCase())) continue;
    onStep(`Adding ${profile.username}…`);
    const { token, created } = await loginOrCreate(profile.username, GUEST_CREW_PASSWORD);
    if (created) await setEnvironment(token, profile.environment);
    await joinOfficer(token);
    usable.push({ username: profile.username, token, hasData: !created && (await hasReadings(token)) });
  }
  for (const [i, member] of usable.entries()) {
    const own = CREW_PROFILES.find((index) => GUEST_ACCOUNTS[index].username.toLowerCase() === member.username.toLowerCase());
    const profileIndex = own ?? CREW_PROFILES[i % CREW_PROFILES.length];
    if (!member.hasData) {
      onStep(`Logging starting readings for ${member.username}…`);
      await seed(GUEST_ACCOUNTS[profileIndex], member.token);
    }
    markEnvironmentChosen(member.username, await getEnvironment(member.token));
    roster.push({ username: member.username, role: 'crew', label: `${member.username} (crew)`, profile: profileIndex });
  }
  saveRoster(roster);
  return officer.token;
}

/** Signs in to one account on the roster. */
export async function guestLogin(username: string): Promise<string> {
  const entry = rosterEntry(username);
  if (!entry) throw new Error(`${username} is not one of the guest accounts.`);
  return auth.login(entry.username, passwordOf(entry));
}

/**
 * Puts one demo account back to its starting state: deletes every reading, logs the profile's
 * starting readings again, and sets its environment and role. The link between the officer and
 * the crew stays, because the backend cannot remove a medical officer once one is named.
 */
export async function resetGuestAccount(username: string, onStep: (text: string) => void) {
  const entry = rosterEntry(username);
  if (!entry) throw new Error(`${username} is not one of the guest accounts.`);
  const profile = profileOf(entry);
  const token = await auth.login(entry.username, passwordOf(entry));
  onStep('Removing the current readings…');
  await wipe(token, await measurementIds());
  onStep('Restoring the environment and role…');
  await setEnvironment(token, profile.environment);
  if (entry.role === 'officer') await makeOfficer(token);
  else await joinOfficer(token);
  onStep('Logging the starting readings…');
  await seed(profile, token);
  clearLocal(entry.username);
  markEnvironmentChosen(entry.username, profile.environment);
}
