// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Gentle nudges: a banner when something is due, a dialog for missed checks, a standing banner once a
// check is flagged to the Crew Medical Officer (the three steps of lib/reminderEscalation.ts),
// a one-tap daily mood check-in, and the result sheet shown after a measurement is saved. The mood
// check-in and the result sheet both offer Undo, which deletes the reading that was just saved.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Measurement, MeasurementSet } from '../../api/types';
import { errorMessage } from '../../api/client';
import { useEnvironment } from '../../auth/EnvironmentContext';
import type { ChangeEntry } from '../../lib/changeLog';
import { environmentNotes } from '../../lib/environment';
import type { GroundAlert } from '../../lib/groundAlerts';
import { lateText, type MissedCheck } from '../../lib/reminderEscalation';
import { ExtremeAlertCard } from '../alerts/GroundAlerts';
import { ChangeNotice } from '../changes/ChangeHistory';
import { displayUnit, formatValue, usesBaseline } from '../../content/inputSpecs';
import { useDeleteMeasurement, useLogMeasurement, type RiskView } from '../../hooks/queries';
import { HOUR, dayKey, toMillis } from '../../lib/dates';
import type { Badge } from '../../lib/gamification';
import { ZONE_LABEL, classify, latestSet, setValue, type Zone } from '../../lib/zones';
import { EscalationCard, Icon, RedFlagCheck, ZoneChip } from '../status/Status';

export function CheckInBanner({ count, firstId, firstName }: { count: number; firstId: string; firstName: string }) {
  if (count === 0) return null;
  return (
    <div className="banner" role="status">
      <Icon name="bell" />
      <p>
        <strong>Time for your {firstName.toLowerCase()}.</strong>{' '}
        {count > 1 ? `${count - 1} more check${count - 1 === 1 ? ' is' : 's are'} due today.` : 'It only takes a few minutes.'}
      </p>
      <Link className="btn btn-filled" to={`/measurements/${encodeURIComponent(firstId)}/perform`}>
        Start
      </Link>
    </div>
  );
}

const SNOOZE_KEY = 'chm.prompt.snoozeUntil';

/**
 * Second and third step of the escalating reminders (lib/reminderEscalation.ts). Pops up for a
 * missed check, at most once every 4 hours. Once the check is flagged to the Crew Medical Officer
 * the dialog says so, comes back every hour, and can no longer be skipped for the day.
 */
export function DuePromptDialog({ check }: { check: MissedCheck }) {
  const flagged = check.stage === 3;
  const quiet = flagged ? HOUR : 4 * HOUR;
  const [open, setOpen] = useState(() => Date.now() > Number(localStorage.getItem(SNOOZE_KEY) ?? 0));
  const snooze = (ms: number) => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + ms));
    setOpen(false);
  };
  useEffect(() => {
    // Seeing the prompt counts: do not show it again for a while even if it is ignored.
    if (open) localStorage.setItem(SNOOZE_KEY, String(Date.now() + quiet));
  }, [open, quiet]);
  if (!open) return null;
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const pace = check.zone === 'red' || check.zone === 'emergency' ? 'Its last reading was in the act-now range, so this reminder moves faster.' : check.zone === 'yellow' ? 'Its last reading was in the watch range, so this reminder moves faster.' : '';
  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-labelledby="due-title">
      <div className={`dialog due-dialog${flagged ? ' flagged' : ''}`}>
        <span className="eyebrow">{flagged ? 'Reminder step 3 of 3' : 'Reminder step 2 of 3'}</span>
        <h2 id="due-title">{flagged ? 'This check has been flagged to your Crew Medical Officer' : 'A check is waiting for you'}</h2>
        <p>
          <strong>{check.name}</strong> is {lateText(check.lateMs)} overdue. {flagged ? 'It now shows as a missed check on the Crew Medical Officer summary until you take it.' : 'Taking it now keeps your health picture up to date.'} {pace}
        </p>
        {!flagged && <p className="muted small">If it stays missed, it will be flagged on the Crew Medical Officer summary.</p>}
        <div className="dialog-actions">
          <Link className="btn btn-filled" to={`/measurements/${encodeURIComponent(check.measurementId)}/perform`} onClick={() => setOpen(false)}>
            Start now
          </Link>
          <button type="button" className="btn btn-outline" onClick={() => snooze(HOUR)}>
            Remind me in 1 hour
          </button>
          {!flagged && (
            <button type="button" className="btn btn-text" onClick={() => snooze(endOfDay.getTime() - Date.now())}>
              Skip today
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Stays on Home while any check is flagged to the Crew Medical Officer. */
export function FlaggedChecksBanner({ checks }: { checks: MissedCheck[] }) {
  if (checks.length === 0) return null;
  const first = checks[0];
  return (
    <div className="banner banner-flagged" role="status">
      <Icon name="warning" />
      <p>
        <strong>
          {checks.length === 1 ? `${first.name} is ${lateText(first.lateMs)} overdue` : `${checks.length} checks are badly overdue`} and flagged to your Crew Medical Officer.
        </strong>{' '}
        {checks.length > 1 && `The oldest is ${first.name}, ${lateText(first.lateMs)} overdue. `}Take {checks.length === 1 ? 'it' : 'them'} to clear the flag.
      </p>
      <Link className="btn btn-filled" to={`/measurements/${encodeURIComponent(first.measurementId)}/perform`}>
        Start
      </Link>
    </div>
  );
}

/** Daily "How do you feel today?" tap. Only shown when the backend lists a mood measurement. */
export function MoodQuickCheck({ measurement, history }: { measurement: Measurement; history: MeasurementSet[] | undefined }) {
  const log = useLogMeasurement(measurement.id);
  const undo = useDeleteMeasurement(measurement.id);
  const [value, setValue_] = useState(7);
  const [saved, setSaved] = useState(false);
  const [undone, setUndone] = useState<ChangeEntry | null>(null);
  const latest = latestSet(history);
  const loggedToday = latest !== null && dayKey(toMillis(latest.timestamp)) === dayKey(Date.now());
  if (loggedToday && !saved) return null;
  return (
    <section className="card mood" aria-label="Daily mood check-in">
      {saved ? (
        <div className="mood-saved">
          <p role="status">
            <Icon name="check" /> Thanks. Your mood for today is logged.
          </p>
          {/* No index: the backend deletes the most recent reading, which is the one just saved. */}
          <button type="button" className="btn btn-text" disabled={undo.isPending} onClick={() => undo.mutate({ action: 'undo' }, { onSuccess: (entry) => { setSaved(false); setUndone(entry); } })}>
            {undo.isPending ? 'Undoing…' : 'Undo'}
          </button>
          {undo.isError && <p className="error-text">{errorMessage(undo.error)}</p>}
        </div>
      ) : (
        <>
          <div>
            <span className="eyebrow">Daily check-in</span>
            <h2>How do you feel today?</h2>
            <p className="muted small">0 is the worst you could feel, 10 is the best. Your answer is private to you and the medical team.</p>
          </div>
          <div className="mood-input">
            <input type="range" min={0} max={10} step={1} value={value} onChange={(e) => setValue_(Number(e.target.value))} aria-label="Mood from 0 to 10" />
            <span className="num mood-value">{value}</span>
            <button type="button" className="btn btn-filled" disabled={log.isPending} onClick={() => { setUndone(null); log.mutate({ values: [value] }, { onSuccess: () => setSaved(true) }); }}>
              {log.isPending ? 'Saving…' : 'Log mood'}
            </button>
          </div>
          {log.isError && <p className="error-text">{errorMessage(log.error)}</p>}
          {undone && <ChangeNotice entry={undone} onDismiss={() => setUndone(null)} />}
        </>
      )}
    </section>
  );
}

interface ResultProps {
  measurement: Measurement;
  history: MeasurementSet[] | undefined;
  /** Risks that use this measurement, with their updated scores. */
  risks: RiskView[];
  newBadges: Badge[];
  nextUp?: string;
  /** Set when this result comes from editing an older reading. */
  change?: ChangeEntry;
  /** Set when this reading is far outside its range: the alert, the clock and the packet text. */
  extreme?: { alert: GroundAlert; now: number; packet: string; onSendNow: () => void };
  onClose: () => void;
  /** Called after Undo removed the reading, with the record of what was removed. */
  onUndone: (entry: ChangeEntry) => void;
}

/** Shown on Home right after a measurement is saved. */
export function ResultSheet({ measurement, history, risks, newBadges, nextUp, change, extreme, onClose, onUndone }: ResultProps) {
  const { environment } = useEnvironment();
  const [emergency, setEmergency] = useState(false);
  const undo = useDeleteMeasurement(measurement.id);
  // Once Undo is pressed the sheet stops showing the reading, so an older one never flashes up.
  const undoing = undo.isPending || undo.isSuccess;
  const latest = latestSet(history);
  const value = latest ? setValue(latest) : null;
  const isVisual = measurement.category === 'visual';
  const result = value !== null && !isVisual ? classify(value, measurement) : null;
  const zone: Zone = emergency ? 'emergency' : (result?.zone ?? 'none');
  const advice = result?.side === 'low' ? measurement.lowRecommendation : result?.side === 'high' ? measurement.highRecommendation : null;
  const firstBaseline = usesBaseline(measurement) && (history?.length ?? 0) === 1;

  if (undoing)
    return (
      <div className="scrim" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <div className="dialog result zone-none">
          <span className="eyebrow">Undo</span>
          <h2 id="result-title">{measurement.name}</h2>
          <p role="status">Removing the reading you just saved…</p>
        </div>
      </div>
    );

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className={`dialog result zone-${zone}`}>
        <span className="eyebrow">{change ? 'Edit saved' : 'Saved'}</span>
        <h2 id="result-title">{measurement.name}</h2>
        {change && <ChangeNotice entry={change} />}
        {isVisual ? (
          <p>Your image is saved. Images are not scored by the app yet, so share it with your Crew Medical Officer at the next check.</p>
        ) : value !== null ? (
          <div className="result-value">
            <span className="num result-number">{formatValue(value)}</span>
            <span className="muted">{displayUnit(measurement)}</span>
            <ZoneChip zone={zone} />
          </div>
        ) : (
          <p>Your reading is saved.</p>
        )}
        {extreme && <ExtremeAlertCard alert={extreme.alert} now={extreme.now} packet={extreme.packet} onSendNow={extreme.onSendNow} inResultSheet />}
        {firstBaseline && <p className="note">This first reading is now your baseline. Later readings are compared with it.</p>}
        {result?.zone === 'green' && !emergency && <p>This reading is in the healthy range. No action needed.</p>}
        {advice && !emergency && (
          <div className="advice">
            <h3>What to do</h3>
            <p>{advice}</p>
          </div>
        )}
        {zone !== 'green' && zone !== 'none' && !emergency && environmentNotes(environment, measurement.id).map((note) => (
          <p key={note} className="note">
            <strong>{environment.name}:</strong> {note}
          </p>
        ))}
        {zone !== 'green' && zone !== 'none' && <EscalationCard zone={zone} />}
        {risks.length > 0 && (
          <div>
            <h3>Risk scores this affects</h3>
            <ul className="mini-risks">
              {risks.map((r) => (
                <li key={r.factor.id}>
                  <Link to={`/risks/${encodeURIComponent(r.factor.id)}`} onClick={onClose}>
                    {r.factor.name}
                  </Link>
                  <span className="num">{r.zone === 'none' ? '–' : r.score}</span>
                  <ZoneChip zone={r.zone} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isVisual && <RedFlagCheck onChange={setEmergency} />}
        {newBadges.map((badge) => (
          <p key={badge.id} className="badge-toast" role="status">
            <Icon name="badge" /> New badge earned: <strong>{badge.name}</strong>
          </p>
        ))}
        {nextUp && <p className="muted">Next up: {nextUp}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-filled" onClick={onClose}>
            {zone === 'green' || zone === 'none' ? 'Done' : `Got it (${ZONE_LABEL[zone].toLowerCase()})`}
          </button>
          {/* No index: the backend deletes the most recent reading, which is the one just saved. */}
          <button type="button" className={extreme ? 'btn btn-outline' : 'btn btn-text'} onClick={() => undo.mutate({ action: 'undo' }, { onSuccess: onUndone })}>
            Undo this entry
          </button>
        </div>
        {undo.isError && <p className="error-text">Could not undo. {errorMessage(undo.error)}</p>}
        <p className="muted small">Made a mistake? Undo removes this reading. You can also delete older readings on the measurement's page.</p>
      </div>
    </div>
  );
}
