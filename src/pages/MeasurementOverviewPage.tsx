// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Measurement overview: chart (or image history) with a plain trend sentence, why the exam matters,
// reminder frequency, and a button to take the measurement.
import { Link, useParams } from 'react-router-dom';
import type { Measurement, MeasurementSet, TrendDirection } from '../api/types';
import { errorMessage } from '../api/client';
import { WhyPanel } from '../components/explain/WhyPanel';
import { ErrorState, Loading, PageHeader } from '../components/layout/AppShell';
import { TrendChart } from '../components/measurement/TrendChart';
import { ZoneChip } from '../components/status/Status';
import { measurementExplainer } from '../content/explainers';
import { displayUnit, formatValue, usesBaseline } from '../content/inputSpecs';
import { useHistory, useMeasurement, useSetFrequency, useTrend, useUpcoming } from '../hooks/queries';
import { DAY, describeDue, formatDateTime, toMillis } from '../lib/dates';
import { ZONE_LABEL, classify, latestSet, setValue, sortOldestFirst } from '../lib/zones';

const FREQUENCIES = [1, 2, 3, 7, 14, 30];

function trendSentence(m: Measurement, history: MeasurementSet[], direction: TrendDirection | null | undefined): string {
  const latest = latestSet(history);
  const value = latest ? setValue(latest) : null;
  if (!latest) return 'No readings yet. Your trend appears after your first two readings.';
  if (m.category === 'visual' || value === null) return `You have saved ${history.length} image${history.length === 1 ? '' : 's'}. Images are not scored by the app yet; the Crew Medical Officer reviews them.`;
  const { zone, side } = classify(value, m);
  const where = zone === 'green' ? 'in the healthy range' : `${side === 'low' ? 'below' : 'above'} the healthy range (${ZONE_LABEL[zone].toLowerCase()})`;
  const base = `Your latest reading is ${formatValue(value)} ${displayUnit(m)}, ${where}.`;
  if (!direction) return `${base} Take one more reading to see which way it is heading.`;
  if (direction === 'flat') return `${base} It is holding steady compared with the reading before.`;
  const towardHealthy = zone === 'green' ? null : (side === 'low') === (direction === 'up');
  const tail = towardHealthy === null ? '' : towardHealthy ? ' That is moving back toward healthy.' : ' That is moving further from healthy.';
  return `${base} It went ${direction} since the reading before.${tail}`;
}

export function MeasurementOverviewPage() {
  const { measurementId = '' } = useParams();
  const measurement = useMeasurement(measurementId);
  const history = useHistory(measurementId);
  const trend = useTrend(measurementId);
  const upcoming = useUpcoming(60);
  const setFrequency = useSetFrequency(measurementId);

  if (measurement.isLoading || history.isLoading) return <Loading />;
  if (measurement.error || history.error || !measurement.data)
    return <ErrorState error={measurement.error ?? history.error} onRetry={() => { void measurement.refetch(); void history.refetch(); }} />;

  const m = measurement.data;
  const sets = history.data ?? [];
  const explainer = measurementExplainer(m);
  const latest = latestSet(sets);
  const value = latest ? setValue(latest) : null;
  const zone = value !== null && m.category === 'numerical' ? classify(value, m).zone : 'none';
  const due = upcoming.data?.find((r) => r.measurementId === measurementId);
  // The backend has no "get frequency" call, so work it out: next due date minus the latest reading.
  const currentFrequency = due && latest ? Math.max(1, Math.round((toMillis(due.dueDate) - toMillis(latest.timestamp)) / DAY)) : null;
  const options = currentFrequency && !FREQUENCIES.includes(currentFrequency) ? [...FREQUENCIES, currentFrequency].sort((a, b) => a - b) : FREQUENCIES;
  const images = sortOldestFirst(sets).reverse().flatMap((set) => (set.images ?? []).map((img) => ({ img, t: toMillis(set.timestamp) })));

  return (
    <div className="page narrow has-bottom-bar">
      <PageHeader title={m.name} eyebrow={explainer.plainName ?? 'Measurement'} back={{ to: '/', label: 'Home' }}>
        <div className="chips">
          {m.category === 'visual' ? <span className="chip zone-none">Image, not scored yet</span> : <ZoneChip zone={zone} label={zone === 'none' ? 'Not taken yet' : undefined} />}
          {due && <span className="chip">{latest ? describeDue(toMillis(due.dueDate)).text : 'First reading due'}</span>}
        </div>
      </PageHeader>

      <section className="card" aria-label="Your readings over time">
        <div className="section-head">
          <h2>{m.category === 'visual' ? 'Your saved images' : 'Your readings over time'}</h2>
          {m.category === 'numerical' && <span className="muted small">{displayUnit(m)}</span>}
        </div>
        {m.category === 'visual' ? (
          images.length === 0 ? (
            <div className="empty">
              <p>No images yet. Take this measurement once and your images appear here, newest first.</p>
            </div>
          ) : (
            <ul className="image-strip">
              {images.map(({ img, t }) => (
                <li key={t}>
                  <img src={img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`} alt={`${m.name} saved ${formatDateTime(t)}`} />
                  <span className="muted small">{formatDateTime(t)}</span>
                </li>
              ))}
            </ul>
          )
        ) : (
          <TrendChart measurement={m} history={sets} />
        )}
        <p className="trend-summary">
          <strong>Trend:</strong> {trendSentence(m, sets, trend.data?.direction)}
        </p>
        {usesBaseline(m) && <p className="muted small">Readings are shown as the change from your first reading, which is your personal baseline.</p>}
      </section>

      <section className="card frequency" aria-label="Reminder frequency">
        <label className="field inline">
          <span>Remind me every</span>
          <select
            value={currentFrequency ?? ''}
            disabled={setFrequency.isPending}
            onChange={(e) => {
              const days = Number(e.target.value);
              if (days >= 1) setFrequency.mutate(days);
            }}
          >
            {currentFrequency === null && <option value="">7 days (standard)</option>}
            {options.map((days) => (
              <option key={days} value={days}>
                {days === 1 ? 'day' : `${days} days`}
              </option>
            ))}
          </select>
        </label>
        <p className="muted small">
          {setFrequency.isPending ? 'Saving…' : setFrequency.isSuccess ? 'Saved. Your reminders are updated.' : 'Days between reminders for this measurement.'}
        </p>
        {setFrequency.isError && <p className="error-text">{errorMessage(setFrequency.error)}</p>}
      </section>

      <WhyPanel why={explainer.why} space={explainer.space} />

      <div className="bottom-bar">
        <div className="bottom-bar-inner">
          <Link className="btn btn-filled btn-wide" to={`/measurements/${encodeURIComponent(measurementId)}/perform`}>
            Take this measurement
          </Link>
        </div>
      </div>
    </div>
  );
}
