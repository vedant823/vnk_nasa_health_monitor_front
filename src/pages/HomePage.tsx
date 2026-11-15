// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Home: readiness, streak and milestone on top; body figure and risk grid on the left;
// upcoming measurements on the right; badges below.
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { WhyPanel } from '../components/explain/WhyPanel';
import { BadgeShelf, HomeStrip } from '../components/gamification/Gamification';
import { ErrorState, Loading } from '../components/layout/AppShell';
import { MeasurementRow } from '../components/measurement/Parts';
import { CheckInBanner, DuePromptDialog, MoodQuickCheck, ResultSheet } from '../components/prompts/Prompts';
import { BodyFigure } from '../components/risk/BodyFigure';
import { Icon, ZoneChip } from '../components/status/Status';
import { BODY_AREA_LABEL, bodyAreaOf, type BodyArea } from '../content/bodyAreas';
import { GENERAL_EXPLAINER } from '../content/explainers';
import { useDashboard, type RiskView } from '../hooks/queries';
import { DAY, describeDue, toMillis } from '../lib/dates';
import { checkInStreak, computeBadges, readinessScore, readinessZone, takeNewBadges, weekProgress, type Badge } from '../lib/gamification';
import { ZONE_RANK, worstZone, type Zone } from '../lib/zones';

type CategoryFilter = 'all' | 'physical' | 'psychological';

function RiskTile({ risk }: { risk: RiskView }) {
  const noData = risk.zone === 'none';
  return (
    <Link to={`/risks/${encodeURIComponent(risk.factor.id)}`} className={`tile zone-${risk.zone}`}>
      <span className="tile-score num">{noData ? '–' : risk.score}</span>
      <span className="tile-name">{risk.factor.name}</span>
      <span className="tile-foot">
        <ZoneChip zone={risk.zone} label={noData ? (risk.hasMeasurements ? 'No readings yet' : 'No measurement yet') : undefined} />
        <span className="muted small">{BODY_AREA_LABEL[bodyAreaOf(risk.factor.id)]}</span>
      </span>
    </Link>
  );
}

export function HomePage() {
  const dash = useDashboard();
  const { username } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [area, setArea] = useState<BodyArea | null>(null);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);

  const result = (location.state as { result?: { measurementId: string } } | null)?.result;

  const areaZones = useMemo(() => {
    const byArea: Partial<Record<BodyArea, Zone[]>> = {};
    for (const r of dash.risks) (byArea[bodyAreaOf(r.factor.id)] ??= []).push(r.zone);
    return Object.fromEntries(Object.entries(byArea).map(([k, zones]) => [k, worstZone(zones)])) as Partial<Record<BodyArea, Zone>>;
  }, [dash.risks]);

  const badges = useMemo(() => computeBadges(dash.measurements, dash.histories, dash.risks), [dash.measurements, dash.histories, dash.risks]);
  const earnedKey = badges.filter((b) => b.earned).map((b) => b.id).join(',');
  useEffect(() => {
    if (dash.isLoading || !username) return;
    const fresh = takeNewBadges(username, badges);
    if (fresh.length) setNewBadges(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earnedKey, dash.isLoading, username]);

  if (dash.isLoading) return <Loading />;
  if (dash.error) return <ErrorState error={dash.error} onRetry={dash.refetch} />;

  const now = Date.now();
  const shownRisks = [...dash.risks]
    .filter((r) => (category === 'all' || r.factor.category === category) && (!area || bodyAreaOf(r.factor.id) === area))
    .sort((a, b) => ZONE_RANK[b.zone] - ZONE_RANK[a.zone] || a.score - b.score || a.factor.name.localeCompare(b.factor.name));

  const dueToday = dash.upcoming.filter((r) => toMillis(r.dueDate) <= now + DAY);
  const overdue = dash.upcoming.find((r) => toMillis(r.dueDate) < now - DAY && (dash.histories[r.measurementId] ?? []).length > 0);
  const nameOf = (id: string) => dash.measurements[id]?.name ?? id.replace(/_/g, ' ');
  const readiness = readinessScore(dash.risks);
  const baselineDone = dash.measurementIds.filter((id) => (dash.histories[id] ?? []).length > 0).length;
  const mood = dash.measurements.mood_score;
  const resultMeasurement = result ? dash.measurements[result.measurementId] : undefined;
  const nextReminder = dash.upcoming.find((r) => r.measurementId !== result?.measurementId);

  return (
    <div className="page">
      <div className="page-header">
        <span className="eyebrow">Home</span>
        <h1>{username ? `Welcome back, ${username}` : 'Welcome back'}</h1>
      </div>

      <HomeStrip
        readiness={readiness}
        zone={readinessZone(readiness)}
        streak={checkInStreak(dash.histories)}
        week={weekProgress(dash.measurementIds, dash.histories)}
        baseline={{ done: baselineDone, total: dash.measurementIds.length }}
      />

      {dueToday.length > 0 && <CheckInBanner count={dueToday.length} firstId={dueToday[0].measurementId} firstName={nameOf(dueToday[0].measurementId)} />}
      {mood && <MoodQuickCheck measurement={mood} history={dash.histories.mood_score} />}

      <div className="home-split">
        <section className="card home-left" aria-label="Your health risks">
          <div className="section-head">
            <h2>Your body and risks</h2>
            <div className="segmented" role="group" aria-label="Filter risks">
              {(['all', 'physical', 'psychological'] as const).map((c) => (
                <button key={c} type="button" className={category === c ? 'on' : ''} aria-pressed={category === c} onClick={() => setCategory(c)}>
                  {c === 'all' ? 'All' : c === 'physical' ? 'Physical' : 'Psychological'}
                </button>
              ))}
            </div>
          </div>
          <p className="muted small">Each score runs from 1 to 100, and 100 is healthy. Tap a body area to filter, or a square to open that risk.</p>
          <div className="body-and-grid">
            <BodyFigure zones={areaZones} selected={area} onSelect={(a) => setArea(area === a ? null : a)} />
            <div>
              {area && (
                <button type="button" className="chip filter-chip" onClick={() => setArea(null)}>
                  Showing: {BODY_AREA_LABEL[area]} ✕
                </button>
              )}
              <div className="risk-grid">
                {shownRisks.map((risk) => (
                  <RiskTile key={risk.factor.id} risk={risk} />
                ))}
              </div>
              {shownRisks.length === 0 && <p className="muted">No risks match this filter.</p>}
            </div>
          </div>
        </section>

        <section className="card home-right" aria-label="Upcoming measurements">
          <Link to="/reminders" className="section-head section-link">
            <h2>Up next</h2>
            <span className="muted small">
              All reminders <Icon name="chevron" size={14} />
            </span>
          </Link>
          {dash.upcoming.length === 0 ? (
            <p className="muted">Nothing due in the next 30 days. Nice work.</p>
          ) : (
            <div className="rows">
              {dash.upcoming.slice(0, 7).map((r) => (
                <MeasurementRow key={r.measurementId} id={r.measurementId} measurement={dash.measurements[r.measurementId]} history={dash.histories[r.measurementId]} zone={dash.zones[r.measurementId] ?? 'none'} dueMs={toMillis(r.dueDate)} />
              ))}
            </div>
          )}
          {dash.upcoming.length > 7 && (
            <Link to="/reminders" className="btn btn-text">
              See all {dash.upcoming.length} reminders
            </Link>
          )}
        </section>
      </div>

      <BadgeShelf badges={badges} />
      <WhyPanel why={GENERAL_EXPLAINER.why} space={GENERAL_EXPLAINER.space} whyTitle="Why are these exams needed?" open={false} />

      {result && resultMeasurement ? (
        <ResultSheet
          measurement={resultMeasurement}
          history={dash.histories[result.measurementId]}
          risks={dash.risks.filter((r) => r.factor.measurementIds.includes(result.measurementId))}
          newBadges={newBadges}
          nextUp={nextReminder ? `${nameOf(nextReminder.measurementId)}, ${describeDue(toMillis(nextReminder.dueDate)).text.toLowerCase()}` : undefined}
          onClose={() => {
            setNewBadges([]);
            navigate('/', { replace: true, state: null });
          }}
        />
      ) : (
        <>
          {newBadges.length > 0 && (
            <div className="toast" role="status">
              <Icon name="badge" /> New badge earned: <strong>{newBadges.map((b) => b.name).join(', ')}</strong>
              <button type="button" className="btn btn-text" onClick={() => setNewBadges([])}>
                Dismiss
              </button>
            </div>
          )}
          {overdue && <DuePromptDialog id={overdue.measurementId} name={nameOf(overdue.measurementId)} overdueText={describeDue(toMillis(overdue.dueDate)).text} />}
        </>
      )}
    </div>
  );
}
