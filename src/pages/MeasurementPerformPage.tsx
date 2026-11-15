// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Measurement performance: what you need, step-by-step instructions with pictures, and a fixed bottom
// bar to enter the reading (or upload an image) and finish, which returns to Home. Opened with
// ?edit=N it corrects reading N of the newest-first history instead of adding a new one.
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { LogMeasurementRequest, Measurement } from '../api/types';
import { errorMessage } from '../api/client';
import { WhyPanel } from '../components/explain/WhyPanel';
import { ErrorState, Loading, PageHeader } from '../components/layout/AppShell';
import { InstructionSteps } from '../components/measurement/Parts';
import { measurementExplainer } from '../content/explainers';
import { displayUnit, formatValue, inputSpec, usesBaseline } from '../content/inputSpecs';
import { useEditMeasurement, useHistory, useLogMeasurement, useMeasurement } from '../hooks/queries';
import { formatGmt } from '../lib/changeLog';
import { classify, setValue } from '../lib/zones';

/** Shrinks a photo in the browser (longest side 1600 px, JPEG) and returns plain base64 for the backend. */
async function imageToBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot prepare the image.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}

function NumericEntry({ m, hasHistory, onSubmit, busy }: { m: Measurement; hasHistory: boolean; onSubmit: (values: number[]) => void; busy: boolean }) {
  const spec = inputSpec(m);
  const [texts, setTexts] = useState<string[]>(spec.fields.map(() => ''));
  const [problem, setProblem] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<number[] | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const numbers = texts.map((t) => Number(t.replace(',', '.')));
    if (texts.some((t) => t.trim() === '') || numbers.some((n) => !Number.isFinite(n))) {
      setProblem(spec.fields.length > 1 ? 'Fill in every box with a number.' : 'Enter a number.');
      return;
    }
    const values = spec.combine === 'firstMinusSecond' ? [numbers[0] - numbers[1]] : numbers;
    if (!m.canBeNegative && values.some((v) => v < 0)) {
      setProblem('This reading cannot be below zero.');
      return;
    }
    setProblem(null);
    // Typo guard: for readings compared directly with the thresholds, double-check "act now" values.
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (!usesBaseline(m) && classify(mean, m).zone === 'red' && confirm === null) {
      setConfirm(values);
      return;
    }
    onSubmit(values);
  };

  return (
    <form className="entry" onSubmit={submit}>
      <div className="entry-fields">
        {spec.fields.map((field, i) => (
          <label key={field.label} className="field">
            <span>{field.label}</span>
            <div className="input-with-unit">
              <input
                inputMode="decimal"
                value={texts[i]}
                onChange={(e) => {
                  setTexts(texts.map((t, j) => (j === i ? e.target.value : t)));
                  setConfirm(null);
                }}
                aria-label={`${field.label} in ${field.unit}`}
              />
              <span className="unit">{field.unit}</span>
            </div>
          </label>
        ))}
        <button type="submit" className="btn btn-filled" disabled={busy}>
          {busy ? 'Saving…' : confirm ? 'Yes, save it' : 'Save and finish'}
        </button>
      </div>
      {confirm && (
        <p className="note" role="alert">
          {formatValue(confirm.reduce((a, b) => a + b, 0) / confirm.length)} is far outside the usual range. Check the device and your typing. If it is right, press "Yes, save it".
        </p>
      )}
      {problem && (
        <p className="error-text" role="alert">
          {problem}
        </p>
      )}
      {(spec.hint || (usesBaseline(m) && !hasHistory)) && (
        <p className="muted small">
          {spec.hint} {usesBaseline(m) && !hasHistory ? 'This first reading becomes your baseline. Later readings are compared with it.' : ''}
        </p>
      )}
    </form>
  );
}

function ImageEntry({ onSubmit, busy }: { onSubmit: (base64: string) => void; busy: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <form
      className="entry"
      onSubmit={(e) => {
        e.preventDefault();
        if (!file) {
          setProblem('Choose or take a picture first.');
          return;
        }
        imageToBase64(file).then(onSubmit, () => setProblem('That file could not be read as an image. Try a JPEG or PNG.'));
      }}
    >
      <div className="entry-fields">
        <label className="field">
          <span>Image from the scanner or camera</span>
          <input type="file" accept="image/*" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setProblem(null); }} />
        </label>
        <button type="submit" className="btn btn-filled" disabled={busy}>
          {busy ? 'Saving…' : 'Save and finish'}
        </button>
      </div>
      {problem && (
        <p className="error-text" role="alert">
          {problem}
        </p>
      )}
      <p className="muted small">The picture is made smaller on this device before it is saved.</p>
    </form>
  );
}

export function MeasurementPerformPage() {
  const { measurementId = '' } = useParams();
  const navigate = useNavigate();
  const measurement = useMeasurement(measurementId);
  const history = useHistory(measurementId);
  const log = useLogMeasurement(measurementId);
  const edit = useEditMeasurement(measurementId);
  const [search] = useSearchParams();
  const editParam = search.get('edit');
  const editIndex = editParam !== null && /^\d+$/.test(editParam) ? Number(editParam) : null;

  if (measurement.isLoading || (editIndex !== null && history.isLoading)) return <Loading />;
  if (measurement.error || !measurement.data) return <ErrorState error={measurement.error} onRetry={() => void measurement.refetch()} />;

  const m = measurement.data;
  const explainer = measurementExplainer(m);
  const finish = () => navigate('/', { state: { result: { measurementId } } });
  const sets = history.data ?? [];
  const editing = editIndex !== null ? sets[editIndex] : undefined;
  const editingValue = editing ? setValue(editing) : null;
  // The baseline (oldest reading) cannot be replaced while later readings are measured against it.
  const editLocked = editIndex !== null && usesBaseline(m) && sets.length > 1 && editIndex === sets.length - 1;
  const busy = log.isPending || edit.isPending;
  const save = (body: LogMeasurementRequest) => {
    if (editIndex !== null && editing)
      edit.mutate({ index: editIndex, body }, { onSuccess: (change) => navigate('/', { state: { result: { measurementId }, change } }) });
    else log.mutate(body, { onSuccess: finish });
  };
  const failure = log.error ?? edit.error;

  return (
    <div className="page narrow has-bottom-bar tall-bar">
      <PageHeader title={editIndex !== null ? `Edit a reading: ${m.name}` : `How to take: ${m.name}`} eyebrow={explainer.plainName ?? 'Measurement'} back={{ to: `/measurements/${encodeURIComponent(measurementId)}`, label: 'Overview' }} />

      {editIndex !== null && (
        <section className="card" aria-label="Reading being edited">
          {editing && !editLocked ? (
            <>
              <h2>You are correcting a saved reading</h2>
              <p>
                Reading taken <strong className="num">{formatGmt(editing.timestamp)}</strong>:{' '}
                <strong>{editingValue === null ? 'a saved image' : `${formatValue(editingValue)} ${displayUnit(m)}`}</strong>.
              </p>
              <p className="muted small">
                Enter the correct reading below. Saving replaces the old reading, and the change is written to the change history with the time in GMT. The
                corrected reading is stored with the current time, because the health system stamps every reading when it is saved.
              </p>
            </>
          ) : (
            <p className="error-text" role="alert">
              {editLocked ? 'This is your baseline reading. It can only be edited once the later readings are deleted.' : 'That reading could not be found. Go back and choose it again.'}
            </p>
          )}
        </section>
      )}

      {explainer.need && (
        <section className="card" aria-label="What you need">
          <h2>What you need</h2>
          <ul className="need-list">
            {explainer.need.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <WhyPanel why={explainer.why} space={explainer.space} open={false} />

      <section className="card" aria-label="Steps">
        <h2>Steps</h2>
        <InstructionSteps measurementId={m.id} instructions={m.instructions} />
      </section>

      <div className="bottom-bar">
        <div className="bottom-bar-inner">
          {editIndex !== null && (!editing || editLocked) ? (
            <p className="muted">Nothing to edit here.</p>
          ) : m.category === 'visual' ? (
            <ImageEntry busy={busy} onSubmit={(image) => save({ image })} />
          ) : (
            <NumericEntry m={m} hasHistory={sets.length > 0 && !(editing && sets.length === 1)} busy={busy} onSubmit={(values) => save({ values })} />
          )}
          {failure != null && (
            <p className="error-text" role="alert">
              {edit.isError ? 'The edit did not finish. Check the saved readings on the measurement page. ' : ''}
              {errorMessage(failure)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
