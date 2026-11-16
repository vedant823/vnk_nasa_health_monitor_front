// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Guest mode controls: the button on the login page, and the bar under the top bar that switches
// between the demo accounts and puts them back to their starting data. See lib/guestMode.ts.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { GUEST_OFFICER, guestLogin, isGuest, loadRoster, prepareGuestAccounts, profileOf, resetGuestAccount, rosterEntry, setGuest } from '../../lib/guestMode';

/** Login page button: opens the demo crew as the medical officer. */
export function GuestStart() {
  const { adopt } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const start = async () => {
    setError(null);
    setStep('Opening the demo crew…');
    try {
      const token = await prepareGuestAccounts(setStep);
      setGuest(true);
      adopt(token, GUEST_OFFICER);
      navigate('/crew', { replace: true });
    } catch (e) {
      setError(e instanceof Error && !('isAxiosError' in e) ? e.message : errorMessage(e));
      setStep(null);
    }
  };
  return (
    <section className="card guest-start" aria-label="Guest mode">
      <h2>Look around first</h2>
      <p className="muted small">
        Guest mode opens a demo crew: the Crew Medical Officer testOfficer and its crew, with made-up readings. You can switch between them, use every screen, and reset them at any time.
      </p>
      <button type="button" className="btn btn-outline btn-wide" disabled={step !== null} onClick={() => void start()}>
        {step ?? 'View in guest mode'}
      </button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** Shown under the top bar while guest mode is on. */
export function GuestBar() {
  const { username, adopt, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'one' | 'all' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!isGuest()) return null;
  const roster = loadRoster();
  const current = rosterEntry(username);

  const run = async (label: string, work: () => Promise<void>) => {
    setBusy(label);
    setMessage(null);
    setConfirm(null);
    try {
      await work();
    } catch (e) {
      setMessage(e instanceof Error && !('isAxiosError' in e) ? e.message : errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const switchTo = (name: string) =>
    run(`Switching to ${name}…`, async () => {
      adopt(await guestLogin(name), name);
      navigate(rosterEntry(name)?.role === 'officer' ? '/crew' : '/');
    });

  const reset = (names: string[]) =>
    run('Resetting…', async () => {
      for (const name of names) await resetGuestAccount(name, (text) => setBusy(`${name}: ${text}`));
      await queryClient.invalidateQueries();
      setMessage(names.length === 1 ? `${names[0]} is back to its starting data.` : 'Every demo account is back to its starting data.');
    });

  return (
    <div className="guest-bar" role="region" aria-label="Guest mode">
      <div className="guest-bar-inner">
        <label className="guest-switch">
          <span>Guest mode, viewing as</span>
          <select value={current?.username ?? ''} disabled={busy !== null} onChange={(e) => void switchTo(e.target.value)}>
            {!current && <option value="">{username}</option>}
            {roster.map((a) => (
              <option key={a.username} value={a.username}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <div className="guest-actions">
          {confirm ? (
            <>
              <span className="small">{confirm === 'one' ? `Delete ${current?.username}'s readings and start over?` : 'Delete every demo account’s readings and start over?'}</span>
              <button type="button" className="btn btn-danger" onClick={() => void reset(confirm === 'one' && current ? [current.username] : roster.map((a) => a.username))}>
                Yes, reset
              </button>
              <button type="button" className="btn btn-text" onClick={() => setConfirm(null)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              {current && (
                <button type="button" className="btn btn-text" disabled={busy !== null} onClick={() => setConfirm('one')}>
                  Reset this account
                </button>
              )}
              <button type="button" className="btn btn-text" disabled={busy !== null} onClick={() => setConfirm('all')}>
                Reset all
              </button>
              <button
                type="button"
                className="btn btn-text"
                disabled={busy !== null}
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Leave guest mode
              </button>
            </>
          )}
        </div>
      </div>
      <p className="guest-story small" role="status">
        {busy ?? message ?? (current ? profileOf(current).story : 'This account is not one of the demo accounts.')}
      </p>
    </div>
  );
}
