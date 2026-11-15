// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Small status pieces: icons, zone chip, score ring, AI watermark, escalation card.
// The icons are original line drawings written as code; they are not based on any agency branding.
import { useState, type ReactNode } from 'react';
import { ESCALATION, RED_FLAGS } from '../../lib/escalation';
import { ZONE_LABEL, type Zone } from '../../lib/zones';

type IconName = 'check' | 'warning' | 'error' | 'siren' | 'dash' | 'chevron' | 'up' | 'down' | 'flat' | 'flame' | 'help' | 'bell' | 'back' | 'badge' | 'lock';

const PATHS: Record<IconName, ReactNode> = {
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.8 2.8L16 9.5" /></>,
  warning: <><path d="M12 3.5l9.5 16.5h-19z" /><path d="M12 10v4.5M12 17.2v.3" /></>,
  error: <><path d="M8.2 3h7.6L21 8.2v7.6L15.8 21H8.2L3 15.8V8.2z" /><path d="M12 7.5v5.5M12 16v.4" /></>,
  siren: <><path d="M7 18v-5a5 5 0 0110 0v5M4.5 18h15v3h-15zM12 3v2M4 7l1.5 1.5M20 7l-1.5 1.5" /></>,
  dash: <><circle cx="12" cy="12" r="9" strokeDasharray="3 3.2" /></>,
  chevron: <path d="M9 5l7 7-7 7" />,
  up: <path d="M6 15l6-6 6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  flat: <path d="M5 12h14" />,
  flame: <path d="M12 3c1 3.5 5 5.5 5 10.5a5 5 0 01-10 0c0-2 1-3.2 2-4.2.2 1.6 1 2.4 1.8 2.7C10.5 9.5 10.8 6 12 3z" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 16.8v.3" /></>,
  bell: <path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 2h-15zM10 20.5h4" />,
  back: <path d="M15 5l-7 7 7 7" />,
  badge: <><circle cx="12" cy="9.5" r="5.5" /><path d="M8.5 14l-1.5 7 5-2.5 5 2.5-1.5-7" /></>,
  lock: <><rect x="6" y="11" width="12" height="9" rx="2" /><path d="M8.5 11V8a3.5 3.5 0 017 0v3" /></>,
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

const ZONE_ICON: Record<Zone, IconName> = { none: 'dash', green: 'check', yellow: 'warning', red: 'error', emergency: 'siren' };

/** A zone is always shown as color + icon + word, never color alone. */
export function ZoneChip({ zone, label }: { zone: Zone; label?: string }) {
  return (
    <span className={`chip zone-${zone}`}>
      <Icon name={ZONE_ICON[zone]} size={15} />
      {label ?? ZONE_LABEL[zone]}
    </span>
  );
}

export function ScoreRing({ score, zone, size = 132, caption }: { score: number | null; zone: Zone; size?: number; caption?: string }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const fraction = score === null || zone === 'none' ? 0 : Math.max(0.02, score / 100);
  return (
    <div className={`score-ring zone-${zone}`} style={{ width: size, height: size }} role="img" aria-label={score === null || zone === 'none' ? 'No score yet' : `Score ${score} out of 100, ${ZONE_LABEL[zone]}`}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} className="ring-track" />
        <circle cx="50" cy="50" r={r} className="ring-value" strokeDasharray={`${c * fraction} ${c}`} transform="rotate(-90 50 50)" />
      </svg>
      <div className="score-ring-text">
        <span className="score-number">{score === null || zone === 'none' ? '–' : score}</span>
        <span className="score-caption">{caption ?? (zone === 'none' ? 'no data' : 'of 100')}</span>
      </div>
    </div>
  );
}

/** Visible watermark required on every AI-generated image in this app. */
export function AiMark() {
  return <span className="ai-mark">AI-generated</span>;
}

export function EscalationCard({ zone, report }: { zone: Zone; report?: string }) {
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const plan = ESCALATION[zone];
  if (!plan) return null;
  return (
    <section className={`card escalation zone-${zone}`} aria-label="What to do next">
      <h3>
        <Icon name={ZONE_ICON[zone]} /> {plan.title}
      </h3>
      <ol className="steps-ladder">
        {plan.steps.map((step, i) => (
          <li key={step.who}>
            <span className="step-num">{i + 1}</span>
            <div>
              <strong>{step.who}</strong>
              <p>{step.what}</p>
            </div>
          </li>
        ))}
      </ol>
      {report && zone !== 'yellow' && (
        <>
          <button type="button" className="btn btn-outline" onClick={() => setShowReport((v) => !v)}>
            {showReport ? 'Hide flight surgeon report' : 'Prepare flight surgeon report'}
          </button>
          {showReport && (
            <div className="report">
              <textarea readOnly value={report} rows={8} aria-label="Flight surgeon report text" />
              <button
                type="button"
                className="btn btn-text"
                onClick={() => {
                  void navigator.clipboard?.writeText(report).then(() => setCopied(true));
                }}
              >
                {copied ? 'Copied' : 'Copy text'}
              </button>
              <p className="muted small">This app does not send messages. Give this text to the Crew Medical Officer or send it at the next communication window.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** Tick-list of symptoms that make any result an emergency. */
export function RedFlagCheck({ onChange }: { onChange: (anyTicked: boolean) => void }) {
  const [ticked, setTicked] = useState<string[]>([]);
  return (
    <fieldset className="red-flags">
      <legend>Do you have any of these right now?</legend>
      {RED_FLAGS.map((flag) => (
        <label key={flag} className="check-row">
          <input
            type="checkbox"
            checked={ticked.includes(flag)}
            onChange={(e) => {
              const next = e.target.checked ? [...ticked, flag] : ticked.filter((f) => f !== flag);
              setTicked(next);
              onChange(next.length > 0);
            }}
          />
          {flag}
        </label>
      ))}
    </fieldset>
  );
}
