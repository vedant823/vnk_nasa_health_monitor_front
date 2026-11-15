// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Image analysis, the way the backend supports it: a medical officer looks at each saved scan,
// ticks the findings they can see on the backend's checklist (GET /data/measurements/{id}/flags),
// and the number of findings is saved (PUT .../score?numAbnormal=N). The backend then scores the
// scan: 0 findings is healthy, 1 is watch, 2 or more is act now. No AI looks at the image.
import { useState } from 'react';
import { errorMessage } from '../../api/client';
import type { Measurement, MeasurementSet } from '../../api/types';
import { useFlags, useScoreScan } from '../../hooks/queries';
import { formatGmt } from '../../lib/changeLog';
import { toMillis } from '../../lib/dates';
import { findingsZone, reviewText, visualZone } from '../../lib/zones';
import { ZoneChip } from '../status/Status';

/** The backend stores bare base64 JPEG; demo mode may hold a full data URL. */
export const scanSrc = (image: string) => (image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`);

export type Reviewer =
  /** No medical officer: the crew member acts as their own, as the backend allows. */
  | 'self'
  /** A medical officer reviewing an assigned crew member's scan. */
  | 'officer'
  /** The crew member has a medical officer, so they cannot score their own scans (403 on the backend). */
  | 'blocked';

interface Props {
  measurement: Measurement;
  /** Newest first, exactly as the backend serves the history. The position is the index it scores. */
  sets: MeasurementSet[];
  reviewer: Reviewer;
  officerName?: string | null;
  /** Set when a medical officer reviews an assigned crew member. */
  childId?: string;
}

function Checklist({ measurement, index, childId, current, onDone }: { measurement: Measurement; index: number; childId?: string; current: number | null; onDone: () => void }) {
  const flags = useFlags(measurement.id);
  const score = useScoreScan(measurement.id, childId);
  const [ticked, setTicked] = useState<string[]>([]);
  if (flags.isLoading) return <p className="muted small">Loading the checklist…</p>;
  if (flags.error) return <p className="error-text">{errorMessage(flags.error)}</p>;
  const list = flags.data ?? [];
  const count = ticked.length;
  return (
    <form
      className="scan-checklist"
      onSubmit={(e) => {
        e.preventDefault();
        score.mutate({ index, numAbnormal: count }, { onSuccess: onDone });
      }}
    >
      <fieldset>
        <legend>Tick every finding you can see in this scan</legend>
        {list.length === 0 && <p className="muted small">The health system has no checklist for this measurement. Saving records zero findings.</p>}
        {list.map((flag) => (
          <label key={flag} className="check-row">
            <input type="checkbox" checked={ticked.includes(flag)} onChange={(e) => setTicked(e.target.checked ? [...ticked, flag] : ticked.filter((f) => f !== flag))} />
            {flag}
          </label>
        ))}
      </fieldset>
      <p className="scan-result" role="status">
        {count} finding{count === 1 ? '' : 's'} ticked: <ZoneChip zone={findingsZone(count)} />
      </p>
      <p className="muted small">
        No findings is healthy, one is watch, two or more is act now. The health system saves the number of findings, not which ones.
        {current !== null && ` This scan currently has ${current} recorded.`}
      </p>
      <div className="dialog-actions">
        <button type="submit" className="btn btn-filled" disabled={score.isPending}>
          {score.isPending ? 'Saving…' : `Save review: ${count} finding${count === 1 ? '' : 's'}`}
        </button>
        <button type="button" className="btn btn-text" onClick={onDone}>
          Cancel
        </button>
      </div>
      {score.isError && <p className="error-text">{errorMessage(score.error, 'The review could not be saved.')}</p>}
    </form>
  );
}

/** Saved scans of one visual measurement, each with its review status and, where allowed, the checklist. */
export function ScanReview({ measurement, sets, reviewer, officerName, childId }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const scans = sets.map((set, index) => ({ set, index })).filter(({ set }) => (set.images ?? []).length > 0);
  if (scans.length === 0) return <p className="muted">No scans saved yet.</p>;
  return (
    <>
      {reviewer === 'blocked' && (
        <p className="note">
          Your medical officer{officerName ? `, ${officerName},` : ''} reviews your scans. You will see the result here once they have.
        </p>
      )}
      {reviewer === 'self' && <p className="muted small">You have no medical officer assigned, so you review your own scans. Assign one on your Profile page and they take over.</p>}
      <ul className="scan-list">
        {scans.map(({ set, index }) => {
          const zone = visualZone(set);
          const reviewed = set.numAbnormal !== null && set.numAbnormal !== undefined;
          return (
            <li key={`${toMillis(set.timestamp)}-${index}`} className="scan">
              <img src={scanSrc(set.images![0])} alt={`${measurement.name} taken ${formatGmt(toMillis(set.timestamp))}`} />
              <div className="scan-body">
                <span className="num">{formatGmt(toMillis(set.timestamp))}</span>
                <ZoneChip zone={zone} label={reviewText(set)} />
                {open === index ? (
                  <Checklist measurement={measurement} index={index} childId={childId} current={set.numAbnormal ?? null} onDone={() => setOpen(null)} />
                ) : (
                  reviewer !== 'blocked' && (
                    <button type="button" className={reviewed ? 'btn btn-text' : 'btn btn-outline'} onClick={() => setOpen(index)}>
                      {reviewed ? 'Review again' : 'Review this scan'}
                    </button>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
