// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Profile: facts about the account, the role and medical officer (stored on the backend), the
// mission environment setting (stored on the backend), and the change history.
// The backend has no account-details call, so the facts are worked out from the readings it returns.
import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { EnvironmentOptions, useEnvironment } from '../auth/EnvironmentContext';
import { ChangeHistoryCard } from '../components/changes/ChangeHistory';
import { ErrorState, Loading, PageHeader } from '../components/layout/AppShell';
import { ZoneChip } from '../components/status/Status';
import { errorMessage } from '../api/client';
import { useBadges, useChildren, useDashboard, useOfficer, useSetOfficer, useSetStatus, useStatus } from '../hooks/queries';
import { formatGmt } from '../lib/changeLog';
import { toMillis } from '../lib/dates';
import { commDelayText, environmentNotes, rangeDifferences } from '../lib/environment';
import { checkInStreak, readinessScore, readinessZone } from '../lib/gamification';

/** Role (crew member or medical officer) and who the crew member's medical officer is. */
function RoleCard() {
  const status = useStatus();
  const officer = useOfficer();
  const isOfficer = status.data === 'medical officer';
  const children = useChildren(isOfficer);
  const setStatus = useSetStatus();
  const setOfficer = useSetOfficer();
  const [name, setName] = useState('');
  const code = (error: unknown) => (axios.isAxiosError(error) ? error.response?.status : undefined);
  const crewCount = children.data?.length ?? 0;
  const locked = !!officer.data || crewCount > 0;

  if (status.isLoading || officer.isLoading) return <section className="card" aria-label="Role"><p className="muted">Loading your role…</p></section>;
  if (status.error) return <section className="card" aria-label="Role"><p className="error-text">{errorMessage(status.error)}</p></section>;

  return (
    <section className="card" aria-label="Role">
      <div className="section-head">
        <h2>Role and medical officer</h2>
        <span className="chip">{isOfficer ? 'Medical officer' : 'Crew member'}</span>
      </div>
      {isOfficer ? (
        <>
          <p>
            You are a medical officer. {crewCount === 0 ? 'No crew members have named you yet.' : `${crewCount} crew member${crewCount === 1 ? ' has' : 's have'} named you as their medical officer.`} You see their risks, readings and
            reminders, and you review their scans.
          </p>
          <div className="dialog-actions">
            <Link className="btn btn-filled" to="/crew">
              Open your crew
            </Link>
            <button type="button" className="btn btn-text" disabled={setStatus.isPending || crewCount > 0} onClick={() => setStatus.mutate('normal')}>
              Go back to crew member
            </button>
          </div>
          {crewCount > 0 && <p className="muted small">You cannot change role while crew members are assigned to you.</p>}
        </>
      ) : (
        <>
          <p>
            {officer.data ? (
              <>
                Your medical officer is <strong>{officer.data}</strong>. They can see your risks, readings and reminders, and they review your scans.
              </>
            ) : (
              'You have no medical officer. You review your own scans until you name one.'
            )}
          </p>
          <form
            className="officer-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) setOfficer.mutate(name.trim(), { onSuccess: () => setName('') });
            }}
          >
            <label className="field">
              <span>{officer.data ? 'Change medical officer (their username)' : "Your medical officer's username"}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </label>
            <button type="submit" className="btn btn-outline" disabled={setOfficer.isPending || !name.trim()}>
              {setOfficer.isPending ? 'Saving…' : 'Save'}
            </button>
          </form>
          {setOfficer.isSuccess && (
            <p className="frequency-saved" role="status">
              Saved. Your medical officer is now {officer.data ?? 'set'}.
            </p>
          )}
          {setOfficer.isError && (
            <p className="error-text">
              {code(setOfficer.error) === 404
                ? 'No account has that username.'
                : code(setOfficer.error) === 409
                  ? 'That account cannot be your medical officer. It must be a medical officer account, and not your own.'
                  : errorMessage(setOfficer.error)}
            </p>
          )}
          <p className="muted small">The health system has no way to remove a medical officer once one is set. You can only change to another.</p>
          <div className="dialog-actions">
            <button type="button" className="btn btn-text" disabled={setStatus.isPending || locked} onClick={() => setStatus.mutate('medical officer')}>
              Become a medical officer
            </button>
          </div>
          {locked && <p className="muted small">You cannot become a medical officer while you have a medical officer of your own.</p>}
        </>
      )}
      {setStatus.isError && <p className="error-text">{code(setStatus.error) === 409 ? 'You cannot change role while you have a medical officer or assigned crew.' : errorMessage(setStatus.error)}</p>}
    </section>
  );
}

export function ProfilePage() {
  const { username, logout } = useAuth();
  const { environment, choose, saveError } = useEnvironment();
  const navigate = useNavigate();
  const dash = useDashboard();
  const badges = useBadges();
  const [justSaved, setJustSaved] = useState(false);

  if (dash.isLoading) return <Loading />;
  if (dash.error) return <ErrorState error={dash.error} onRetry={dash.refetch} />;

  const times = Object.values(dash.histories).flatMap((history) => (history ?? []).map((set) => toMillis(set.timestamp)));
  const tracked = dash.measurementIds.length;
  const started = dash.measurementIds.filter((id) => (dash.histories[id] ?? []).length > 0).length;
  const readiness = readinessScore(dash.risks);
  const earned = badges.data?.earned?.length ?? 0;
  const totalBadges = earned + (badges.data?.unearned?.length ?? 0);
  const differences = rangeDifferences(environment);
  const notes = environmentNotes(environment);

  const facts: [string, string][] = [
    ['Username', username || 'unknown'],
    ['Mission environment', environment.name],
    ['Readings saved', String(times.length)],
    ['Measurements started', `${started} of ${tracked}`],
    ['First reading', times.length ? formatGmt(Math.min(...times)) : 'None yet'],
    ['Latest reading', times.length ? formatGmt(Math.max(...times)) : 'None yet'],
    ['Check-in streak', `${checkInStreak(dash.histories)} day${checkInStreak(dash.histories) === 1 ? '' : 's'}`],
    ['Badges earned', badges.data ? `${earned} of ${totalBadges}` : 'Not available'],
  ];

  return (
    <div className="page narrow">
      <PageHeader title="Your profile" eyebrow="Profile" back={{ to: '/', label: 'Home' }} />

      <section className="card" aria-label="Account">
        <div className="section-head">
          <h2>Account</h2>
          <ZoneChip zone={readinessZone(readiness)} label={readiness === null ? 'No readiness score yet' : `Mission readiness ${readiness} of 100`} />
        </div>
        <dl className="facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="muted small">
          You stay signed in on this device until you log out. Your readings, role, medical officer and environment are kept by the mission's health system. Your change
          history and reminder choices are kept on this device.
        </p>
        <div className="dialog-actions">
          <Link to="/summary" className="btn btn-outline">
            Crew Medical Officer summary
          </Link>
          <button
            type="button"
            className="btn btn-text"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Log out
          </button>
        </div>
      </section>

      <RoleCard />

      <section className="card" aria-label="Settings">
        <h2>Settings: mission environment</h2>
        <p>Choose where you are now. The ranges, advice and escalation steps across the app follow this choice.</p>
        <EnvironmentOptions
          value={environment.id}
          onChange={(id) => {
            choose(id);
            setJustSaved(true);
          }}
        />
        {justSaved && !saveError && (
          <p className="frequency-saved" role="status">
            Saved. The app now uses: {environment.name}.
          </p>
        )}
        {saveError && <p className="error-text">{saveError}</p>}
        <dl className="facts">
          <div>
            <dt>Message delay to Earth</dt>
            <dd>{commDelayText(environment)}</dd>
          </div>
          <div>
            <dt>Getting back to full medical care</dt>
            <dd>{environment.care}</dd>
          </div>
        </dl>

        <h3>Ranges that change here</h3>
        {differences.length === 0 ? (
          <p className="muted">The space station uses the standard ranges. Nothing is adjusted.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>What</th>
                <th>Space station</th>
                <th>{environment.name}</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {differences.map((row) => (
                <tr key={row.metric}>
                  <td>{row.metric}</td>
                  <td>{row.station}</td>
                  <td>
                    <strong>{row.here}</strong>
                  </td>
                  <td>{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted small">
          These values come from the team's ranges guide. The health system stores your environment and scores your risks with its ranges. For the measurements it
          tracks today, those ranges are the same in every environment, so their colors do not change. The ranges above are used in the advice you see.
        </p>

        {notes.length > 0 && (
          <>
            <h3>Advice for this environment</h3>
            <ul className="advice-list">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <ChangeHistoryCard title="Change history: edits, undos and deletes" />
    </div>
  );
}
