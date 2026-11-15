// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
import axios, { AxiosError, type CreateAxiosDefaults } from 'axios';
import { mockAdapter } from './mock';

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL && !USE_MOCKS) {
  throw new Error(
    'VITE_API_URL is not set. Copy .env.example to .env.local and set VITE_API_URL (for example http://localhost:8080).',
  );
}

export const TOKEN_KEY = 'chm.token';
export const USERNAME_KEY = 'chm.username';

let onUnauthorized: () => void = () => {};
/** AuthContext registers a handler so an expired or invalid token sends the user back to login. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

const config: CreateAxiosDefaults = {
  baseURL: baseURL || 'http://mock.local',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
};
if (USE_MOCKS) config.adapter = mockAdapter;

/** The single HTTP client. Pages never call axios directly; they use the hooks in src/hooks. */
export const api = axios.create(config);

const isLoginCall = (url?: string) => (url ?? '').startsWith('/users/login');

api.interceptors.request.use((request) => {
  const token = localStorage.getItem(TOKEN_KEY);
  // /users/** needs the Bearer token; /data/** is public and login has no token yet.
  if (token && request.url?.startsWith('/users/') && !isLoginCall(request.url)) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !isLoginCall(error.config?.url)) onUnauthorized();
    return Promise.reject(error);
  },
);

/** Turns any failure into one plain sentence for the person using the app. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'No connection to the health system. Check that it is running, then try again.';
    const status = error.response.status;
    if (status === 401) return 'Your session ended. Please log in again.';
    if (status === 404) return "We couldn't find that item.";
    const body = error.response.data as unknown;
    if (status === 403) return 'You are not allowed to do that with this account.';
    if (status === 400 || status === 409) {
      if (typeof body === 'string' && body.length > 0 && body.length < 200) return body;
      if (body && typeof body === 'object') {
        const detail = (body as { detail?: unknown; message?: unknown }).detail ?? (body as { message?: unknown }).message;
        if (typeof detail === 'string' && detail.length > 0) return detail;
      }
      return status === 409 ? 'That change conflicts with how this account is set up.' : 'That entry was not accepted. Check the value and try again.';
    }
  }
  return fallback;
}
