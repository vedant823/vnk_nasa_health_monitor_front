// AI-generated code and illustrations (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Measurement building blocks: list row, step illustrations and instruction steps.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Instruction, Measurement, MeasurementSet, TrendDirection } from '../../api/types';
import { measurementExplainer } from '../../content/explainers';
import { displayUnit, formatValue } from '../../content/inputSpecs';
import { describeDue } from '../../lib/dates';
import { latestSet, reviewText, setValue, type Zone } from '../../lib/zones';
import { AiMark, Icon, ZoneChip } from '../status/Status';
import { StepArt } from './StepArt';

interface RowProps {
  id: string;
  measurement?: Measurement;
  history?: MeasurementSet[];
  zone: Zone;
  dueMs?: number;
  trend?: TrendDirection | null;
}

/** One measurement in a list. Clicking it opens the measurement's overview screen. */
export function MeasurementRow({ id, measurement, history, zone, dueMs, trend }: RowProps) {
  const name = measurement?.name ?? id.replace(/_/g, ' ');
  const plain = measurement ? measurementExplainer(measurement).plainName : undefined;
  const latest = latestSet(history);
  const value = latest ? setValue(latest) : null;
  const due = dueMs !== undefined ? describeDue(dueMs) : null;
  const neverTaken = !history || history.length === 0;
  return (
    <Link to={`/measurements/${encodeURIComponent(id)}`} className={`row${due?.overdue ? ' overdue' : ''}`}>
      <div className="row-main">
        <span className="row-title">{name}</span>
        {plain && <span className="muted small">{plain}</span>}
      </div>
      <div className="row-meta">
        {value !== null && measurement && (
          <span className="value-chip">
            <span className="num">{formatValue(value)}</span> <span className="muted small">{displayUnit(measurement)}</span>
            {trend && <Icon name={trend} size={14} />}
          </span>
        )}
        <ZoneChip zone={zone} label={neverTaken ? 'Not taken yet' : measurement?.category === 'visual' ? reviewText(latest) : undefined} />
        {due && <span className={`due${due.overdue ? ' overdue' : ''}`}>{neverTaken ? 'First reading due' : due.text}</span>}
        <Icon name="chevron" size={16} />
      </div>
    </Link>
  );
}

/**
 * Picture for one instruction step. If the team has added an image at the path the backend gives
 * (public/images/<measurementId>/stepN.png) it is shown with the "AI-generated" label on top.
 * Otherwise the drawing for that step from StepArt.tsx is used, which has "AI-generated" drawn
 * into the picture itself.
 */
export function StepIllustration({ measurementId, step, src, text }: { measurementId: string; step: number; src: string; text: string }) {
  const [failed, setFailed] = useState(!src);
  return (
    <div className="step-art">
      {failed ? (
        <StepArt measurementId={measurementId} step={step} text={text} />
      ) : (
        <>
          <img src={`${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`} alt={`Illustration for step ${step}: ${text}`} loading="lazy" onError={() => setFailed(true)} />
          <AiMark />
        </>
      )}
    </div>
  );
}

/** Numbered steps with a picture and one plain sentence each. Ticking a step keeps your place. */
export function InstructionSteps({ measurementId, instructions }: { measurementId: string; instructions: Instruction[] }) {
  const [done, setDone] = useState<number[]>([]);
  if (!instructions.length) return <p className="muted">No instructions are available for this measurement yet. Ask the Crew Medical Officer how to take it.</p>;
  return (
    <ol className="instructions">
      {instructions.map((instruction, i) => {
        const isDone = done.includes(i);
        return (
          <li key={i} className={`instruction${isDone ? ' done' : ''}`}>
            <StepIllustration measurementId={measurementId} step={i + 1} src={instruction.image} text={instruction.text} />
            <div className="instruction-body">
              <span className="label">Step {i + 1} of {instructions.length}</span>
              <p>{instruction.text}</p>
              <label className="check-row">
                <input type="checkbox" checked={isDone} onChange={(e) => setDone(e.target.checked ? [...done, i] : done.filter((d) => d !== i))} />
                Done
              </label>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
