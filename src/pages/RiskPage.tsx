// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// One screen per risk factor: title, category, score ring, picture of the body area, why it matters,
// recommendations, escalation steps and its measurements ordered by urgency.
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { user } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { useEnvironment } from '../auth/EnvironmentContext';
import { WhyPanel } from '../components/explain/WhyPanel';
import { ErrorState, Loading, PageHeader } from '../components/layout/AppShell';
import { MeasurementRow } from '../components/measurement/Parts';
import { BodyFigure } from '../components/risk/BodyFigure';
import { EscalationCard, RedFlagCheck, ScoreRing, ZoneChip } from '../components/status/Status';
import { BODY_AREA_LABEL, bodyAreaOf } from '../content/bodyAreas';
import { riskSpaceEffect } from '../content/explainers';
import { displayUnit, formatValue, tidyNumbers } from '../content/inputSpecs';
import { useDashboard, useRiskFactor, useRiskScore } from '../hooks/queries';
import { formatGmt } from '../lib/changeLog';
import { formatDateTime, toMillis } from '../lib/dates';
import { commDelayText, environmentNotes } from '../lib/environment';
import { ZONE_LABEL, ZONE_RANK, latestSet, scoreZone, setValue, type Zone } from '../lib/zones';

export function RiskPage() {
  const { riskId = '' } = useParams();
  const { username } = useAuth();
  const { environment } = useEnvironment();
  const factor = useRiskFactor(riskId);
  const evaluation = useRiskScore(riskId);
  const dash = useDashboard();
  const [emergency, setEmergency] = useState(false);
  const ids = factor.data?.measurementIds ?? [];
  const trends = useQueries({ queries: ids.map((id) => ({ queryKey: ['trend', id], queryFn: () => user.getTrend(id) })) });

  if (factor.isLoading || evaluation.isLoading || dash.isLoading) return <Loading />;
  if (factor.error || evaluation.error || dash.error || !factor.data || !evaluation.data)
    return <ErrorState error={factor.error ?? evaluation.error ?? dash.error} onRetry={() => { void factor.refetch(); void evaluation.refetch(); dash.refetch(); }} />;

  const risk = factor.data;
  const score = evaluation.data.score;
  const hasReadings = ids.some((id) => (dash.histories[id] ?? []).length > 0);
  const anyScored = ids.some((id) => (dash.zones[id] ?? 'none') !== 'none');
  const baseZone: Zone = hasReadings && (anyScored || score < 100) ? scoreZone(score) : 'none';
  const zone: Zone = emergency ? 'emergency' : baseZone;
  const area = bodyAreaOf(risk.id);
  const dueById = new Map(dash.upcoming.map((r) => [r.measurementId, toMillis(r.dueDate)]));

  // Most urgent first: act-now readings, then watch, then whatever is due soonest.
  const ordered = ids
    .map((id, i) => ({ id, trend: trends[i]?.data?.direction ?? null }))
    .sort((a, b) => {
      const rank = ZONE_RANK[dash.zones[b.id] ?? 'none'] * Number((dash.zones[b.id] ?? 'none') !== 'green') - ZONE_RANK[dash.zones[a.id] ?? 'none'] * Number((dash.zones[a.id] ?? 'none') !== 'green');
      return rank || (dueById.get(a.id) ?? Infinity) - (dueById.get(b.id) ?? Infinity);
    });

  const envNotes = [...new Set(ids.flatMap((id) => environmentNotes(environment, id)))];
  const report = [
    'FLIGHT SURGEON REPORT (prepared by the crew member in Crew Health Monitor)',
    `Crew member: ${username || 'unknown'}    Prepared: ${formatGmt(Date.now())}`,
    `Environment: ${environment.name}    Message delay to Earth: ${commDelayText(environment)}    ${environment.care}`,
    `Risk: ${risk.name} (${risk.category})    Score: ${score} of 100 (${ZONE_LABEL[zone]})`,
    `Why the score: ${tidyNumbers(evaluation.data.reason)}`,
    'Latest readings:',
    ...ids.map((id) => {
      const m = dash.measurements[id];
      const latest = latestSet(dash.histories[id]);
      const value = latest ? setValue(latest) : null;
      if (!m || !latest) return `- ${m?.name ?? id}: not taken yet`;
      if (value === null) return `- ${m.name}: image saved ${formatDateTime(toMillis(latest.timestamp))}`;
      return `- ${m.name}: ${formatValue(value)} ${displayUnit(m)} (${ZONE_LABEL[dash.zones[id] ?? 'none']}), ${formatDateTime(toMillis(latest.timestamp))}`;
    }),
    'Recommendations shown to the crew member:',
    ...evaluation.data.advice.map((a) => `- ${a}`),
    ...envNotes.map((a) => `- (${environment.name}) ${a}`),
    emergency ? 'Crew member reports a red-flag symptom. EMERGENCY.' : '',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="page">
      <PageHeader title={risk.name} eyebrow="Risk" back={{ to: '/', label: 'Home' }}>
        <div className="chips">
          <span className="chip">{risk.category === 'physical' ? 'Physical' : 'Psychological'}</span>
          <span className="chip">{BODY_AREA_LABEL[area]}</span>
        </div>
      </PageHeader>

      <section className="card risk-hero">
        <div className="risk-score">
          <ScoreRing score={score} zone={zone} size={156} />
          <ZoneChip zone={zone} label={zone === 'none' ? (ids.length ? 'No readings yet' : 'No measurement yet') : undefined} />
          <p className="muted small">Score from 1 to 100, worked out by the health system. 100 is healthy.</p>
        </div>
        <BodyFigure zones={{ [area]: zone }} highlight={area} compact />
        <div className="risk-summary">
          <h2>What your score means</h2>
          {zone === 'none' ? (
            <p>
              {ids.length
                ? 'There are no scored readings for this risk yet. Take the measurements below to get your score.'
                : 'This risk has no onboard measurement in the app yet, so it cannot be scored. Tell the Crew Medical Officer about any symptoms.'}
            </p>
          ) : (
            <p>{tidyNumbers(evaluation.data.reason)}</p>
          )}
          <p className="muted small">Every risk starts at 100. Each reading outside the healthy range lowers it: 40 points for a "watch" reading, 75 for an "act now" reading.</p>
        </div>
      </section>

      <WhyPanel whyTitle="Why pay attention to this?" why={risk.reason} space={riskSpaceEffect(risk)} />

      {zone !== 'none' && (
        <section className="card" aria-label="Recommendations">
          <h2>{zone === 'green' ? 'Keep it up' : 'How to improve your score'}</h2>
          <ul className="advice-list">
            {evaluation.data.advice.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          {envNotes.length > 0 && (
            <div className="note">
              <strong>Because you are in: {environment.name}</strong>
              <ul className="advice-list">
                {envNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {zone !== 'green' && zone !== 'none' && <EscalationCard zone={zone} report={report} />}

      <section className="card" aria-label="Measurements for this risk">
        <div className="section-head">
          <h2>Measurements</h2>
          <span className="muted small">Most urgent first</span>
        </div>
        {ordered.length === 0 ? (
          <p className="muted">No measurements are linked to this risk yet.</p>
        ) : (
          <div className="rows">
            {ordered.map(({ id, trend }) => (
              <MeasurementRow key={id} id={id} measurement={dash.measurements[id]} history={dash.histories[id]} zone={dash.zones[id] ?? 'none'} dueMs={dueById.get(id)} trend={trend} />
            ))}
          </div>
        )}
      </section>

      {hasReadings && (
        <section className="card">
          <RedFlagCheck onChange={setEmergency} />
        </section>
      )}
    </div>
  );
}
