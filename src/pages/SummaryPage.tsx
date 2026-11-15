// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Crew Medical Officer summary: one page with the red flags, every risk, the latest reading of
// every measurement, and recent changes. It can be printed or read out. Times are in GMT.
// It also holds the packets prepared automatically for extreme readings and the missed checks that
// the escalating reminders have flagged.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useEnvironment } from '../auth/EnvironmentContext';
import { PacketText, alertStatusText, useGroundAlerts } from '../components/alerts/GroundAlerts';
import { ChangeList } from '../components/changes/ChangeHistory';
import { ErrorState, Loading, PageHeader } from '../components/layout/AppShell';
import { ScanReview } from '../components/scans/ScanReview';
import { ScoreRing, ZoneChip } from '../components/status/Status';
import { displayUnit, formatValue, tidyNumbers } from '../content/inputSpecs';
import { useDashboard, useOfficer } from '../hooks/queries';
import { formatGmt } from '../lib/changeLog';
import { describeDue, toMillis } from '../lib/dates';
import { commDelayText, environmentNotes } from '../lib/environment';
import { RED_FLAGS } from '../lib/escalation';
import { readinessScore, readinessZone } from '../lib/gamification';
import { alertStatus } from '../lib/groundAlerts';
import { STAGE_LABEL, lateText, missedChecks } from '../lib/reminderEscalation';
import { ZONE_LABEL, ZONE_RANK, latestSet, reviewText, setValue, sortOldestFirst, type Zone } from '../lib/zones';

interface Flag {
  zone: Zone;
  text: string;
  to: string;
}

/**
 * With no props this is the signed-in crew member's own summary. With a child it is a medical
 * officer's view of an assigned crew member, read through the officer endpoints: links to the
 * crew member's own pages become plain text, and the parts kept on that crew member's device
 * (change history, extreme-reading alerts, their environment) are left out.
 */
export function SummaryPage({ child }: { child?: { id: string; username: string } }) {
  const { username: ownName } = useAuth();
  const { environment } = useEnvironment();
  const dash = useDashboard(child?.id);
  const ground = useGroundAlerts(dash, !child);
  const myOfficer = useOfficer();
  const username = child ? child.username : ownName;
  const Go = ({ to, children }: { to: string; children: ReactNode }) => (child ? <span>{children}</span> : <Link to={to}>{children}</Link>);

  if (dash.isLoading) return <Loading />;
  if (dash.error) return <ErrorState error={dash.error} onRetry={dash.refetch} />;

  const now = Date.now();
  const readiness = readinessScore(dash.risks);
  const dueById = new Map(dash.upcoming.map((r) => [r.measurementId, toMillis(r.dueDate)]));

  const readings = dash.measurementIds
    .map((id) => {
      const m = dash.measurements[id];
      const latest = latestSet(dash.histories[id]);
      const value = latest ? setValue(latest) : null;
      return { id, m, latest, value, zone: dash.zones[id] ?? 'none', due: dueById.get(id) };
    })
    .sort((a, b) => ZONE_RANK[b.zone] - ZONE_RANK[a.zone] || (a.m?.name ?? a.id).localeCompare(b.m?.name ?? b.id));

  const risks = [...dash.risks].sort((a, b) => ZONE_RANK[b.zone] - ZONE_RANK[a.zone] || a.score - b.score || a.factor.name.localeCompare(b.factor.name));

  const flags: Flag[] = [];
  for (const r of readings) {
    if ((r.zone === 'red' || r.zone === 'yellow') && r.m?.category === 'visual')
      flags.push({ zone: r.zone, text: `${r.m.name}: ${reviewText(r.latest)} on review (${ZONE_LABEL[r.zone]})`, to: `/measurements/${encodeURIComponent(r.id)}` });
    else if ((r.zone === 'red' || r.zone === 'yellow') && r.m && r.value !== null)
      flags.push({ zone: r.zone, text: `${r.m.name}: ${formatValue(r.value)} ${displayUnit(r.m)} (${ZONE_LABEL[r.zone]})`, to: `/measurements/${encodeURIComponent(r.id)}` });
  }
  for (const r of risks) {
    if (r.zone === 'red' || r.zone === 'yellow')
      flags.push({ zone: r.zone, text: `Risk: ${r.factor.name}, score ${r.score} of 100 (${ZONE_LABEL[r.zone]})`, to: `/risks/${encodeURIComponent(r.factor.id)}` });
  }
  flags.sort((a, b) => ZONE_RANK[b.zone] - ZONE_RANK[a.zone]);
  // Missed checks from the escalating reminders: step 2 (overdue) and step 3 (flagged).
  const overdue = missedChecks(dash, now).filter((c) => c.stage >= 2);
  const flaggedChecks = overdue.filter((c) => c.stage === 3);
  const neverTaken = readings.filter((r) => !r.latest);
  const notes = child ? [] : environmentNotes(environment);
  const scans = readings.filter((r) => r.m?.category === 'visual' && r.latest);
  const awaiting = scans.filter((r) => r.latest?.numAbnormal === null || r.latest?.numAbnormal === undefined).length;

  return (
    <div className="page summary">
      <PageHeader title={child ? `Crew member: ${child.username}` : 'Crew Medical Officer summary'} back={child ? { to: '/crew', label: 'Your crew' } : { to: '/', label: 'Home' }}>
        <div className="chips">
          <span className="chip">Crew member: {username || 'unknown'}</span>
          {!child && <span className="chip">Environment: {environment.name}</span>}
          {!child && <span className="chip">Medical officer: {myOfficer.data ?? 'none assigned'}</span>}
          <span className="chip num">Prepared {formatGmt(now)}</span>
          <button type="button" className="btn btn-outline no-print" onClick={() => window.print()}>
            Print this page
          </button>
        </div>
      </PageHeader>

      <section className="card summary-top" aria-label="Overall status">
        <ScoreRing score={readiness} zone={readinessZone(readiness)} size={120} />
        <div>
          <h2>Mission readiness: {readiness === null ? 'no score yet' : `${readiness} of 100`}</h2>
          <p>
            {flags.filter((f) => f.zone === 'red').length} act-now item{flags.filter((f) => f.zone === 'red').length === 1 ? '' : 's'},{' '}
            {flags.filter((f) => f.zone === 'yellow').length} to watch, {overdue.length} overdue check{overdue.length === 1 ? '' : 's'} ({flaggedChecks.length} flagged), {ground.active.length} extreme reading
            {ground.active.length === 1 ? '' : 's'}, {neverTaken.length} measurement
            {neverTaken.length === 1 ? '' : 's'} never taken.
          </p>
          {child ? (
            <p className="muted small">Risk scores use the ranges for this crew member's own environment. The health system does not tell a medical officer which environment that is.</p>
          ) : (
            <p className="muted small">
              Message delay to Earth: {commDelayText(environment).toLowerCase()}. {environment.care}
            </p>
          )}
        </div>
      </section>

      {ground.alerts.length > 0 && (
        <section className="card" aria-label="Extreme readings">
          <div className="section-head">
            <h2>Extreme readings: packets prepared automatically</h2>
            <span className="muted small">Times are in GMT</span>
          </div>
          <p className="muted small">
            A packet is prepared when a reading is past its act-now limit by at least the width of its watch band. The crew member has 5 minutes to undo a mistaken reading before the ground crew is marked
            as notified. Simulated in this prototype: nothing is sent off this device.
          </p>
          {ground.active.map((alert) => (
            <div key={alert.key} className={`packet zone-emergency${alertStatus(alert, ground.now) === 'pending' ? ' pending' : ''}`}>
              <h3>
                {alert.measurementName}: {alert.valueText}
              </h3>
              <p role="status">
                <strong>{alertStatusText(alert, ground.now)}.</strong>
              </p>
              <PacketText text={ground.packetFor(alert)} />
            </div>
          ))}
          {ground.alerts.filter((a) => !ground.active.includes(a)).length > 0 && (
            <>
              <h3>Earlier alerts</h3>
              <ol className="change-list">
                {ground.alerts
                  .filter((a) => !ground.active.includes(a))
                  .slice(0, 10)
                  .map((alert) => (
                    <li key={alert.key}>
                      <span className="num change-when">{formatGmt(alert.createdAt)}</span>
                      <span>
                        {alert.measurementName}: {alert.valueText}. {alert.withdrawnAt ? alertStatusText(alert, ground.now) : `${alertStatusText(alert, ground.now)}. A newer reading has been saved since`}.
                      </span>
                    </li>
                  ))}
              </ol>
            </>
          )}
        </section>
      )}

      <section className="card" aria-label="Red flags">
        <div className="section-head">
          <h2>Red flags</h2>
          <span className="muted small">Most urgent first</span>
        </div>
        {flags.length === 0 && overdue.length === 0 ? (
          <p>
            <ZoneChip zone="green" label="Nothing flagged" /> Every scored reading is in the healthy range and nothing is overdue.
          </p>
        ) : (
          <ul className="flag-list">
            {flags.map((flag) => (
              <li key={flag.text}>
                <ZoneChip zone={flag.zone} />
                <Go to={flag.to}>{flag.text}</Go>
              </li>
            ))}
            {overdue.map((c) => (
              <li key={`overdue-${c.measurementId}`}>
                <span className={`chip${c.stage === 3 ? ' chip-flagged' : ''}`}>{c.stage === 3 ? 'Missed check' : 'Overdue'}</span>
                <Go to={`/measurements/${encodeURIComponent(c.measurementId)}`}>
                  {c.name}: {lateText(c.lateMs)} overdue. {STAGE_LABEL[c.stage]}.
                </Go>
              </li>
            ))}
          </ul>
        )}
        <h3>Ask about these symptoms</h3>
        <p className="muted small">Any one of these is an emergency, whatever the numbers say:</p>
        <ul className="advice-list">
          {RED_FLAGS.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
        {notes.length > 0 && (
          <>
            <h3>Keep in mind in this environment</h3>
            <ul className="advice-list">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      {scans.length > 0 && (
        <section className="card" aria-label="Scans">
          <div className="section-head">
            <h2>Scans and their review</h2>
            <span className="muted small">{awaiting === 0 ? 'All reviewed' : `${awaiting} awaiting review`}</span>
          </div>
          {scans.map((r) => (
            <div key={r.id} className="scan-group">
              <h3>{r.m!.name}</h3>
              <ScanReview
                measurement={r.m!}
                sets={sortOldestFirst(dash.histories[r.id] ?? []).reverse()}
                reviewer={child ? 'officer' : myOfficer.data ? 'blocked' : 'self'}
                officerName={myOfficer.data}
                childId={child?.id}
              />
            </div>
          ))}
        </section>
      )}

      <section className="card" aria-label="All risks">
        <div className="section-head">
          <h2>All risks</h2>
          <span className="muted small">{risks.length} risks, worst first</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Risk</th>
                <th>Type</th>
                <th>Score</th>
                <th>Status</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r) => (
                <tr key={r.factor.id}>
                  <td>
                    <Go to={`/risks/${encodeURIComponent(r.factor.id)}`}>{r.factor.name}</Go>
                  </td>
                  <td>{r.factor.category === 'physical' ? 'Physical' : 'Psychological'}</td>
                  <td className="num">{r.zone === 'none' ? '–' : r.score}</td>
                  <td>
                    <ZoneChip zone={r.zone} label={r.zone === 'none' ? (r.hasMeasurements ? 'No readings yet' : 'No measurement yet') : undefined} />
                  </td>
                  <td>{r.zone === 'none' ? 'Not scored yet.' : tidyNumbers(r.evaluation?.reason ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-label="Latest readings">
        <div className="section-head">
          <h2>Latest readings</h2>
          <span className="muted small">Times are in GMT</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Measurement</th>
                <th>Latest reading</th>
                <th>Status</th>
                <th>Taken</th>
                <th>Next check</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Go to={`/measurements/${encodeURIComponent(r.id)}`}>{r.m?.name ?? r.id.replace(/_/g, ' ')}</Go>
                  </td>
                  <td>
                    {!r.latest ? (
                      '–'
                    ) : r.value === null || !r.m ? (
                      'Scan saved'
                    ) : (
                      <>
                        <span className="num">{formatValue(r.value)}</span> <span className="muted small">{displayUnit(r.m)}</span>
                      </>
                    )}
                  </td>
                  <td>
                    <ZoneChip zone={r.zone} label={!r.latest ? 'Not taken yet' : r.m?.category === 'visual' ? reviewText(r.latest) : undefined} />
                  </td>
                  <td className="num">{r.latest ? formatGmt(toMillis(r.latest.timestamp)) : '–'}</td>
                  <td>{r.due === undefined ? '–' : r.latest ? describeDue(r.due).text : 'First reading due'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {!child && (
      <section className="card" aria-label="Recent changes">
        <div className="section-head">
          <h2>Recent edits, undos and deletes</h2>
          <span className="muted small">Times are in GMT</span>
        </div>
        <ChangeList limit={10} />
      </section>
      )}

      <p className="muted small">Prototype for demonstration. Not a medical device. The ranges and scores have not been clinically validated.</p>
    </div>
  );
}
