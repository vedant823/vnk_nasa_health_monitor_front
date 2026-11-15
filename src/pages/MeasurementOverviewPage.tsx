// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Measurement overview: chart (or image history) with a plain trend sentence, why the exam matters,
// reminder frequency, a log of saved readings that can be deleted, and a button to take the measurement.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Measurement, MeasurementSet, TrendDirection } from '../api/types';
import { USERNAME_KEY, errorMessage } from '../api/client';
import { useEnvironment } from '../auth/EnvironmentContext';
import { ChangeHistoryCard, ChangeNotice } from '../components/changes/ChangeHistory';
import { WhyPanel } from '../components/explain/WhyPanel';
import { ErrorState, Loading, PageHeader } from '../components/layout/AppShell';
import { TrendChart } from '../components/measurement/TrendChart';
import { ZoneChip } from '../components/status/Status';
import { measurementExplainer } from '../content/explainers';
import { displayUnit, formatValue, usesBaseline } from '../content/inputSpecs';
import { useDeleteMeasurement, useHistory, useMeasurement, useSetFrequency, useTrend, useUpcoming } from '../hooks/queries';
import type { ChangeEntry } from '../lib/changeLog';
import { DAY, describeDue, formatDateTime, toMillis } from '../lib/dates';
import { environmentNotes } from '../lib/environment';
import { ZONE_LABEL, classify, latestSet, setValue, sortOldestFirst } from '../lib/zones';

const FREQUENCIES = [1, 2, 3, 7, 14, 30];
/** The backend reminds every 7 days until a frequency is set. */
const DEFAULT_FREQUENCY = 7;

const frequencyKey = (measurementId: string) => `chm.frequency.${localStorage.getItem(USERNAME_KEY) ?? ''}.${measurementId}`;
function loadFrequency(measurementId: string): number | null {
  try {
    const days = Number(localStorage.getItem(frequencyKey(measurementId)));
    return Number.isInteger(days) && days >= 1 ? days : null;
  } catch {
    return null;
  }
}
function saveFrequency(measurementId: string, days: number) {
  try {
    localStorage.setItem(frequencyKey(measurementId), String(days));
  } catch {
    // Storage blocked: the backend still has the new frequency.
  }
}

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

/**
 * Saved readings, newest first, each with a delete button. The backend deletes by position in the
 * newest-first list it serves, so the index sent is the reading's place in that same list.
 * For measurements compared with a baseline, the first reading is the baseline and the backend
 * refuses to delete it while later readings exist, so its button is switched off with a reason.
 */
function ReadingLog({ measurement: m, sets }: { measurement: Measurement; sets: MeasurementSet[] }) {
  const remove = useDeleteMeasurement(m.id);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [removed, setRemoved] = useState<ChangeEntry | null>(null);
  const navigate = useNavigate();
  if (sets.length === 0) return null;
  const baselineIndex = usesBaseline(m) ? sets.length - 1 : -1;
  return (
    <section className="card" aria-label="Saved readings">
      <div className="section-head">
        <h2>Saved readings</h2>
        <span className="muted small">{sets.length} saved, newest first</span>
      </div>
      <p className="muted small">Logged something by mistake? Edit or delete it here. Your scores, trend and reminders update right away, and the change is written to the change history below.</p>
      <ul className="reading-log">
        {sets.map((set, index) => {
          const value = setValue(set);
          const scored = m.category === 'numerical' && value !== null;
          const isBaseline = index === baselineIndex;
          const locked = isBaseline && sets.length > 1;
          return (
            <li key={`${set.timestamp}-${index}`}>
              <span className="reading-when">
                {formatDateTime(toMillis(set.timestamp))}
                {isBaseline && <span className="chip">Baseline</span>}
              </span>
              {scored ? (
                <span className="reading-value">
                  <span className="num">{formatValue(value)}</span> <span className="muted small">{displayUnit(m)}</span>
                </span>
              ) : (
                <span className="reading-value muted">Image</span>
              )}
              {scored ? <ZoneChip zone={classify(value, m).zone} /> : <span />}
              {confirming === index ? (
                <span className="reading-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate({ index, action: 'delete' }, {
                        onSuccess: (entry) => setRemoved(entry),
                        onSettled: () => setConfirming(null),
                      })
                    }
                  >
                    {remove.isPending ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button type="button" className="btn btn-text" disabled={remove.isPending} onClick={() => setConfirming(null)}>
                    Keep
                  </button>
                </span>
              ) : (
                <span className="reading-actions">
                  <button
                    type="button"
                    className="btn btn-text"
                    disabled={locked || remove.isPending}
                    title={locked ? 'This is your baseline. It can be edited once the later readings are gone.' : undefined}
                    aria-label={`Edit the reading from ${formatDateTime(toMillis(set.timestamp))}`}
                    onClick={() => navigate(`/measurements/${encodeURIComponent(m.id)}/perform?edit=${index}`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-text"
                    disabled={locked || remove.isPending}
                    title={locked ? 'This is your baseline. Delete the later readings first.' : undefined}
                    aria-label={`Delete the reading from ${formatDateTime(toMillis(set.timestamp))}`}
                    onClick={() => {
                      setRemoved(null);
                      remove.reset();
                      setConfirming(index);
                    }}
                  >
                    Delete
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {baselineIndex >= 0 && sets.length > 1 && (
        <p className="muted small">Your first reading is your baseline. Later readings are measured against it, so it can only be edited or deleted once the others are gone.</p>
      )}
      {confirming !== null && <p className="note">Deleting a reading cannot be undone. If you delete it by mistake, take the measurement again.</p>}
      {removed && !remove.isError && <ChangeNotice entry={removed} onDismiss={() => setRemoved(null)} />}
      {remove.isError && <p className="error-text">Could not delete. {errorMessage(remove.error)}</p>}
    </section>
  );
}

export function MeasurementOverviewPage() {
  const { measurementId = '' } = useParams();
  const measurement = useMeasurement(measurementId);
  const history = useHistory(measurementId);
  const trend = useTrend(measurementId);
  const upcoming = useUpcoming(60);
  const setFrequency = useSetFrequency(measurementId);
  const { environment } = useEnvironment();
  // The choice is remembered on this device, because the backend has no call that returns it.
  const [chosenFrequency, setChosenFrequency] = useState<number | null>(() => loadFrequency(measurementId));

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
  const derivedFrequency = due && latest ? Math.max(1, Math.round((toMillis(due.dueDate) - toMillis(latest.timestamp)) / DAY)) : null;
  // What the dropdown shows: the value just chosen, else what the reminders imply, else the backend's standard 7 days.
  const currentFrequency = chosenFrequency ?? derivedFrequency ?? DEFAULT_FREQUENCY;
  const options = FREQUENCIES.includes(currentFrequency) ? FREQUENCIES : [...FREQUENCIES, currentFrequency].sort((a, b) => a - b);
  const envNotes = environmentNotes(environment, m.id);
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

      {envNotes.length > 0 && (
        <section className="card" aria-label="Advice for your environment">
          <h2>In your environment: {environment.name}</h2>
          <ul className="advice-list">
            {envNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      <ReadingLog measurement={m} sets={sets} />
      <ChangeHistoryCard measurementId={m.id} />

      <section className="card frequency" aria-label="Reminder frequency">
        <label className="field inline">
          <span>Remind me every</span>
          <select
            value={currentFrequency}
            disabled={setFrequency.isPending}
            onChange={(e) => {
              const days = Number(e.target.value);
              if (days < 1) return;
              const previous = chosenFrequency;
              // Show the new choice at once; go back if the backend refuses it.
              setChosenFrequency(days);
              setFrequency.mutate(days, {
                onSuccess: () => saveFrequency(measurementId, days),
                onError: () => setChosenFrequency(previous),
              });
            }}
          >
            {options.map((days) => (
              <option key={days} value={days}>
                {days === 1 ? 'day' : `${days} days`}
              </option>
            ))}
          </select>
        </label>
        <p className={setFrequency.isSuccess ? 'frequency-saved' : 'muted small'} role="status">
          {setFrequency.isPending
            ? 'Saving…'
            : setFrequency.isSuccess
              ? `Saved. You will now be reminded every ${currentFrequency === 1 ? 'day' : `${currentFrequency} days`}.`
              : `Currently every ${currentFrequency === 1 ? 'day' : `${currentFrequency} days`}. Change it to set the days between reminders.`}
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
