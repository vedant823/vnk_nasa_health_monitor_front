// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// The medical officer's pages, backed by the backend's officer endpoints: the crew assigned to
// them (GET /users/children), every overdue check across that crew (GET /users/overdue), and one
// crew member's full summary with scan review (the /users/children/{id}/... endpoints).
import { useQueries } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { officer } from '../api/endpoints';
import { ErrorState, Loading, PageHeader } from '../components/layout/AppShell';
import { ZoneChip } from '../components/status/Status';
import { useChildren, useCrewOverdue, useRiskFactors, useStatus } from '../hooks/queries';
import { formatGmt } from '../lib/changeLog';
import { toMillis } from '../lib/dates';
import { lateText } from '../lib/reminderEscalation';
import { scoreZone } from '../lib/zones';
import { SummaryPage } from './SummaryPage';

const pretty = (id: string) => id.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

function NotAnOfficer() {
  return (
    <div className="page narrow">
      <PageHeader title="Crew" back={{ to: '/', label: 'Home' }} />
      <section className="card">
        <h2>This page is for medical officers</h2>
        <p>Your account is a crew member account. To review other crew members, change your role to medical officer on your Profile page. You can only do that while you have no medical officer of your own.</p>
        <Link className="btn btn-outline" to="/profile">
          Open Profile
        </Link>
      </section>
    </div>
  );
}

export function CrewPage() {
  const status = useStatus();
  const isOfficer = status.data === 'medical officer';
  const children = useChildren(isOfficer);
  const overdue = useCrewOverdue(isOfficer);
  const factors = useRiskFactors();
  const crew = children.data ?? [];
  const scores = useQueries({
    queries: crew.map((child) => ({ queryKey: ['riskScores', child.userId], queryFn: () => officer.getRiskScores(child.userId) })),
  });

  if (status.isLoading) return <Loading label="Loading your crew…" />;
  if (status.error) return <ErrorState error={status.error} onRetry={() => void status.refetch()} />;
  if (!isOfficer) return <NotAnOfficer />;
  if (children.isLoading || overdue.isLoading) return <Loading label="Loading your crew…" />;
  if (children.error || overdue.error) return <ErrorState error={children.error ?? overdue.error} onRetry={() => { void children.refetch(); void overdue.refetch(); }} />;

  const now = Date.now();
  const late = overdue.data ?? [];
  const nameOf = new Map(crew.map((c) => [c.userId, c.username]));
  // A risk only counts once it has at least one measurement behind it and scores below 100.
  const scored = new Set((factors.data ?? []).filter((f) => f.measurementIds.length > 0).map((f) => f.id));

  return (
    <div className="page">
      <PageHeader title="Your crew" back={{ to: '/', label: 'Home' }}>
        <p className="muted">Crew members who named you as their medical officer. Open one to see every risk, reading and scan, and to review their scans.</p>
      </PageHeader>

      {crew.length === 0 ? (
        <section className="card">
          <h2>No crew assigned yet</h2>
          <p>A crew member adds you themselves: on their Profile page they enter your username as their medical officer. They then appear here.</p>
        </section>
      ) : (
        <section className="card" aria-label="Crew members">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crew member</th>
                  <th>Act now</th>
                  <th>Watch</th>
                  <th>Overdue checks</th>
                  <th>Last reading</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {crew.map((child, i) => {
                  const list = (scores[i]?.data ?? []).filter((e) => scored.has(e.riskId) && e.score < 100);
                  const red = list.filter((e) => scoreZone(e.score) === 'red').length;
                  const yellow = list.filter((e) => scoreZone(e.score) === 'yellow').length;
                  const behind = late.filter((r) => r.childId === child.userId).length;
                  return (
                    <tr key={child.userId}>
                      <td>
                        <strong>{child.username}</strong>
                      </td>
                      <td>{scores[i]?.isLoading ? '…' : red > 0 ? <ZoneChip zone="red" label={`${red} risk${red === 1 ? '' : 's'}`} /> : 'None'}</td>
                      <td>{scores[i]?.isLoading ? '…' : yellow > 0 ? <ZoneChip zone="yellow" label={`${yellow} risk${yellow === 1 ? '' : 's'}`} /> : 'None'}</td>
                      <td className="num">{behind}</td>
                      <td className="num">{child.latestMeasurement ? formatGmt(toMillis(child.latestMeasurement)) : 'No readings yet'}</td>
                      <td>
                        <Link className="btn btn-outline" to={`/crew/${encodeURIComponent(child.userId)}`}>
                          Open summary
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card" aria-label="Overdue checks across the crew">
        <div className="section-head">
          <h2>Overdue checks across the crew</h2>
          <span className="muted small">{late.length} overdue, oldest first</span>
        </div>
        {late.length === 0 ? (
          <p>
            <ZoneChip zone="green" label="Nothing overdue" /> Every assigned crew member is up to date.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crew member</th>
                  <th>Check</th>
                  <th>Overdue by</th>
                  <th>Was due</th>
                </tr>
              </thead>
              <tbody>
                {late.map((r) => (
                  <tr key={`${r.childId}-${r.measurementId}`}>
                    <td>
                      <Link to={`/crew/${encodeURIComponent(r.childId)}`}>{nameOf.get(r.childId) ?? r.childId}</Link>
                    </td>
                    <td>{pretty(r.measurementId)}</td>
                    <td>{lateText(Math.max(0, now - toMillis(r.dueDate)))}</td>
                    <td className="num">{formatGmt(toMillis(r.dueDate))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/** One assigned crew member's summary, read through the officer endpoints. */
export function CrewMemberPage() {
  const { childId = '' } = useParams();
  const children = useChildren(true);
  if (children.isLoading) return <Loading label="Loading the crew member…" />;
  if (children.error) return <ErrorState error={children.error} onRetry={() => void children.refetch()} />;
  const child = (children.data ?? []).find((c) => c.userId === childId);
  if (!child)
    return (
      <div className="page narrow">
        <PageHeader title="Crew member not found" back={{ to: '/crew', label: 'Your crew' }} />
        <section className="card">
          <p>This crew member is not assigned to you. Only crew who named you as their medical officer can be opened.</p>
        </section>
      </div>
    );
  return <SummaryPage child={{ id: child.userId, username: child.username }} />;
}
