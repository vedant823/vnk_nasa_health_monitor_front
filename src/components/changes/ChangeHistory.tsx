// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Shows edits, undos and deletes: the date and time in GMT, and what changed from what.
import { describeChange, formatGmt, loadChanges, type ChangeEntry } from '../../lib/changeLog';
import { Icon } from '../status/Status';

/** Confirmation shown right after an edit, undo or delete. */
export function ChangeNotice({ entry, onDismiss }: { entry: ChangeEntry; onDismiss?: () => void }) {
  return (
    <div className="toast change-notice" role="status">
      <Icon name="check" />
      <span>
        <strong className="num">{formatGmt(entry.at)}</strong> {describeChange(entry)}
      </span>
      {onDismiss && (
        <button type="button" className="btn btn-text" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  );
}

/** Newest first. Pass a measurement id to show only that measurement's changes. */
export function ChangeList({ measurementId, limit, empty = 'No readings have been edited, undone or deleted.' }: { measurementId?: string; limit?: number; empty?: string }) {
  const all = loadChanges().filter((entry) => !measurementId || entry.measurementId === measurementId);
  const entries = limit ? all.slice(0, limit) : all;
  if (entries.length === 0) return <p className="muted small">{empty}</p>;
  return (
    <>
      <ol className="change-list">
        {entries.map((entry, i) => (
          <li key={`${entry.at}-${i}`}>
            <span className="num change-when">{formatGmt(entry.at)}</span>
            <span>{describeChange(entry)}</span>
          </li>
        ))}
      </ol>
      {limit && all.length > limit && <p className="muted small">Showing the latest {limit} of {all.length} changes.</p>}
    </>
  );
}

export function ChangeHistoryCard({ measurementId, title = 'Change history' }: { measurementId?: string; title?: string }) {
  return (
    <section className="card" aria-label={title}>
      <div className="section-head">
        <h2>{title}</h2>
        <span className="muted small">Times are in GMT</span>
      </div>
      <ChangeList measurementId={measurementId} />
      <p className="muted small">Every edit, undo and delete is written down here so the medical team can see what was changed. This record is kept on this device.</p>
    </section>
  );
}
