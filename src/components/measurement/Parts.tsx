// AI-generated code and illustrations (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Measurement building blocks: list row, step illustrations and instruction steps.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Instruction, Measurement, MeasurementSet, TrendDirection } from '../../api/types';
import { measurementExplainer } from '../../content/explainers';
import { displayUnit, formatValue } from '../../content/inputSpecs';
import { describeDue } from '../../lib/dates';
import { latestSet, setValue, type Zone } from '../../lib/zones';
import { AiMark, Icon, ZoneChip } from '../status/Status';

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
        {measurement?.category === 'visual' && !neverTaken ? <span className="chip zone-none">Not scored</span> : <ZoneChip zone={zone} label={neverTaken ? 'Not taken yet' : undefined} />}
        {due && <span className={`due${due.overdue ? ' overdue' : ''}`}>{neverTaken ? 'First reading due' : due.text}</span>}
        <Icon name="chevron" size={16} />
      </div>
    </Link>
  );
}

type Glyph = 'drop' | 'scale' | 'hand' | 'eye' | 'heart' | 'moon' | 'brain' | 'balance' | 'smile' | 'sun' | 'clipboard';

function glyphFor(measurementId: string): Glyph {
  const id = measurementId.toLowerCase();
  if (/blood|lymph|cell/.test(id)) return 'drop';
  if (/mass|weight/.test(id)) return 'scale';
  if (/grip|muscle/.test(id)) return 'hand';
  if (/ocular|retina|oct|eye|fundus/.test(id)) return 'eye';
  if (/heart|ejection|stand|systolic|pressure/.test(id)) return 'heart';
  if (/sleep/.test(id)) return 'moon';
  if (/memory|cognit/.test(id)) return 'brain';
  if (/balance/.test(id)) return 'balance';
  if (/mood/.test(id)) return 'smile';
  if (/solar|proton|radiation/.test(id)) return 'sun';
  return 'clipboard';
}

const GLYPHS: Record<Glyph, JSX.Element> = {
  drop: <path d="M60 22c14 20 24 32 24 46a24 24 0 01-48 0c0-14 10-26 24-46z" />,
  scale: <><rect x="28" y="34" width="64" height="56" rx="12" /><path d="M46 52a14 14 0 0128 0M60 52l6-8" /></>,
  hand: <><path d="M44 92V52a6 6 0 0112 0v-12a6 6 0 0112 0v12-6a6 6 0 0112 0v14-2a6 6 0 0112 0v22c0 14-10 24-24 24-12 0-18-6-24-18" /></>,
  eye: <><path d="M20 60c12-18 26-26 40-26s28 8 40 26c-12 18-26 26-40 26s-28-8-40-26z" /><circle cx="60" cy="60" r="12" /></>,
  heart: <><path d="M60 94C34 76 24 62 30 48c6-12 22-12 30 2 8-14 24-14 30-2 6 14-4 28-30 46z" /><path d="M34 64h14l5-10 8 18 5-8h20" /></>,
  moon: <path d="M78 76a32 32 0 01-34-46 34 34 0 1046 40 32 32 0 01-12 6z" />,
  brain: <><path d="M60 30c-10-8-28-2-28 14-8 6-8 20 2 26 0 14 16 20 26 12 10 8 26 2 26-12 10-6 10-20 2-26 0-16-18-22-28-14z" /><path d="M60 30v52M46 50c6 0 8 4 8 8M74 50c-6 0-8 4-8 8" /></>,
  balance: <><circle cx="60" cy="30" r="8" /><path d="M60 38v30M32 50h56M60 68l-14 26M60 68l14 26" /></>,
  smile: <><circle cx="60" cy="60" r="34" /><path d="M46 68c8 10 20 10 28 0M48 50v2M72 50v2" /></>,
  sun: <><circle cx="60" cy="60" r="16" /><path d="M60 24v10M60 86v10M24 60h10M86 60h10M35 35l7 7M78 78l7 7M35 85l7-7M78 42l7-7" /></>,
  clipboard: <><rect x="34" y="28" width="52" height="68" rx="8" /><path d="M48 28v-6h24v6M46 52h28M46 66h28M46 80h16" /></>,
};

/**
 * Picture for one instruction step. If the team has added an image at the path the backend gives
 * (public/images/<measurementId>/stepN.png) it is shown; otherwise a simple drawn placeholder is
 * used. Both are AI-generated, so both carry the visible "AI-generated" watermark.
 */
export function StepIllustration({ measurementId, step, src }: { measurementId: string; step: number; src: string }) {
  const [failed, setFailed] = useState(!src);
  return (
    <div className="step-art">
      {failed ? (
        <svg viewBox="0 0 120 120" role="img" aria-label={`Illustration for step ${step}`}>
          <rect width="120" height="120" className="art-bg" />
          <g className="art-glyph">{GLYPHS[glyphFor(measurementId)]}</g>
          <circle cx="22" cy="22" r="13" className="art-badge" />
          <text x="22" y="27" textAnchor="middle" className="art-num">{step}</text>
        </svg>
      ) : (
        <img src={`${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`} alt={`Illustration for step ${step}`} loading="lazy" onError={() => setFailed(true)} />
      )}
      <AiMark />
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
            <StepIllustration measurementId={measurementId} step={i + 1} src={instruction.image} />
            <div className="instruction-body">
              <span className="eyebrow">Step {i + 1} of {instructions.length}</span>
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
