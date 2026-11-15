// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// The crew member's mission environment. A new account must pick one before using the app, and it
// can be changed later on the Profile page. The backend stores it (GET and PUT /users/environment)
// and scores risks with that environment's ranges. This browser only remembers that a choice was made.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../api/client';
import { user } from '../api/endpoints';
import { Loading } from '../components/layout/AppShell';
import { AppMark } from '../components/layout/AppShell';
import {
  ENVIRONMENTS,
  commDelayText,
  environmentById,
  isEnvironmentId,
  loadEnvironment,
  rangeDifferences,
  saveEnvironment,
  type Environment,
  type EnvironmentId,
} from '../lib/environment';
import { RequireAuth, useAuth } from './AuthContext';

interface EnvironmentState {
  /** Null until the crew member has chosen. */
  chosen: EnvironmentId | null;
  /** The chosen environment, or the space station while nothing is chosen. */
  environment: Environment;
  choose: (id: EnvironmentId) => void;
  /** False while the backend's answer is still loading. */
  ready: boolean;
  /** Set when the last change could not be saved on the backend. */
  saveError: string | null;
}

const EnvironmentContext = createContext<EnvironmentState | null>(null);

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const { username, token } = useAuth();
  const queryClient = useQueryClient();
  // What this browser remembers: that the crew member picked, and what they picked.
  const [picked, setPicked] = useState<EnvironmentId | null>(() => loadEnvironment(username));
  const [saveError, setSaveError] = useState<string | null>(null);
  useEffect(() => {
    setPicked(loadEnvironment(username));
    setSaveError(null);
  }, [username]);

  const server = useQuery({ queryKey: ['environment', username], queryFn: user.getEnvironment, enabled: !!token && !!username, staleTime: Infinity });
  const fromServer = isEnvironmentId(server.data) ? server.data : null;
  // The backend starts every account on the space station. Anything else means a choice was made
  // (maybe on another device), so the account is not asked again.
  const chosen: EnvironmentId | null = picked !== null ? (fromServer ?? picked) : fromServer !== null && fromServer !== 'station' ? fromServer : null;

  const choose = useCallback(
    (id: EnvironmentId) => {
      saveEnvironment(username, id);
      setPicked(id);
      setSaveError(null);
      const previous = queryClient.getQueryData(['environment', username]);
      queryClient.setQueryData(['environment', username], id);
      user
        .setEnvironment(id)
        // Risk scores and badges are worked out with the environment's ranges, so reload everything.
        .then(() => queryClient.invalidateQueries())
        .catch((error: unknown) => {
          queryClient.setQueryData(['environment', username], previous);
          setSaveError(`Your environment could not be saved. ${errorMessage(error)}`);
        });
    },
    [username, queryClient],
  );
  const ready = !token || !server.isLoading;
  const value = useMemo(() => ({ chosen, environment: environmentById(chosen), choose, ready, saveError }), [chosen, choose, ready, saveError]);
  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}

export function useEnvironment(): EnvironmentState {
  const ctx = useContext(EnvironmentContext);
  if (!ctx) throw new Error('useEnvironment must be used inside EnvironmentProvider');
  return ctx;
}

/** Radio cards for the five environments. Used at first sign-in and on the Profile page. */
export function EnvironmentOptions({ value, onChange }: { value: EnvironmentId | null; onChange: (id: EnvironmentId) => void }) {
  return (
    <div className="env-options" role="radiogroup" aria-label="Mission environment">
      {ENVIRONMENTS.map((env) => {
        const changes = rangeDifferences(env).length;
        return (
          <label key={env.id} className={`env-option${value === env.id ? ' selected' : ''}`}>
            <input type="radio" name="environment" value={env.id} checked={value === env.id} onChange={() => onChange(env.id)} />
            <span className="env-name">{env.name}</span>
            <span className="muted small">{env.summary}</span>
            <span className="muted small">Message delay to Earth: {commDelayText(env).toLowerCase()}.</span>
            <span className="muted small">{changes === 0 ? 'Standard ranges.' : `${changes} range${changes === 1 ? '' : 's'} adjusted for this environment.`}</span>
          </label>
        );
      })}
    </div>
  );
}

/** Shown instead of the app until an environment is chosen. */
function EnvironmentSetup() {
  const { choose } = useEnvironment();
  const { username } = useAuth();
  const [picked, setPicked] = useState<EnvironmentId | null>(null);
  return (
    <div className="page narrow">
      <section className="card env-setup" aria-labelledby="env-title">
        <div className="login-brand">
          <AppMark size={40} />
          <div>
            <h1 id="env-title">Where are you on this mission, {username}?</h1>
          </div>
        </div>
        <p>
          Your environment changes some healthy ranges, the advice you get, and how fast help from Earth can reach you. You can change it later on your
          Profile page.
        </p>
        <EnvironmentOptions value={picked} onChange={setPicked} />
        <div className="dialog-actions">
          <button type="button" className="btn btn-filled" disabled={picked === null} onClick={() => picked && choose(picked)}>
            Continue
          </button>
        </div>
        {picked === null && <p className="muted small">Choose one to continue.</p>}
      </section>
    </div>
  );
}

/** Signed in, and an environment has been chosen. */
export function Protected({ children }: { children: ReactNode }) {
  const { chosen, ready } = useEnvironment();
  return <RequireAuth>{!ready ? <Loading /> : chosen === null ? <EnvironmentSetup /> : children}</RequireAuth>;
}
