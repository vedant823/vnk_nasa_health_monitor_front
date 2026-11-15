// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Health over time: one line of readings on top of healthy / watch / act-now bands taken from the
// measurement's thresholds. Zones are shown by color plus a word in the tooltip and table view.
import { useMemo, useState } from 'react';
import { CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Measurement, MeasurementSet } from '../../api/types';
import { displayUnit, formatValue, usesBaseline } from '../../content/inputSpecs';
import { DAY, formatDate, formatDateTime, toMillis } from '../../lib/dates';
import { ZONE_LABEL, classify, setValue, sortOldestFirst } from '../../lib/zones';

interface Point {
  t: number;
  v: number;
  zone: 'green' | 'yellow' | 'red';
}

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: 'All', days: 0 },
];

function yDomain(values: number[], m: Measurement): [number, number] {
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (m.abnormalLow !== null) lo = Math.min(lo, m.abnormalLow);
  if (m.abnormalHigh !== null) hi = Math.max(hi, m.abnormalHigh);
  const span = Math.max(hi - lo, 1e-6);
  // Show the "act now" limits only when they are close enough not to flatten the line.
  if (m.dangerousLow !== null && m.abnormalLow !== null && m.abnormalLow - m.dangerousLow <= span) lo = Math.min(lo, m.dangerousLow);
  if (m.dangerousHigh !== null && m.abnormalHigh !== null && m.dangerousHigh - m.abnormalHigh <= span) hi = Math.max(hi, m.dangerousHigh);
  const pad = Math.max((hi - lo) * 0.1, 0.5);
  lo -= pad;
  hi += pad;
  if (!m.canBeNegative) lo = Math.max(0, lo);
  return [lo, hi];
}

function bands(m: Measurement, lo: number, hi: number) {
  const clamp = (x: number) => Math.min(hi, Math.max(lo, x));
  const edges = [
    lo,
    clamp(m.dangerousLow ?? lo),
    clamp(m.abnormalLow ?? m.dangerousLow ?? lo),
    clamp(m.abnormalHigh ?? m.dangerousHigh ?? hi),
    clamp(m.dangerousHigh ?? hi),
    hi,
  ];
  const zones = ['red', 'yellow', 'green', 'yellow', 'red'] as const;
  return zones.map((zone, i) => ({ zone, y1: edges[i], y2: edges[i + 1] })).filter((b) => b.y2 > b.y1);
}

function Dot(props: { cx?: number; cy?: number; payload?: Point }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  return <circle cx={cx} cy={cy} r={5} className={`chart-dot zone-${payload.zone}`} />;
}

export function TrendChart({ measurement, history }: { measurement: Measurement; history: MeasurementSet[] }) {
  const [range, setRange] = useState(30);
  const [asTable, setAsTable] = useState(false);
  const unit = displayUnit(measurement);

  const all = useMemo<Point[]>(
    () =>
      sortOldestFirst(history).flatMap((set) => {
        const v = setValue(set);
        return v === null ? [] : [{ t: toMillis(set.timestamp), v, zone: classify(v, measurement).zone }];
      }),
    [history, measurement],
  );
  const points = range === 0 ? all : all.filter((p) => p.t >= Date.now() - range * DAY);

  if (!all.length) {
    return (
      <div className="empty">
        <p>No readings yet. Take this measurement once and your chart starts here.</p>
      </div>
    );
  }

  const [lo, hi] = yDomain((points.length ? points : all).map((p) => p.v), measurement);
  const tMin = points.length ? points[0].t : Date.now() - DAY;
  const tMax = points.length ? points[points.length - 1].t : Date.now();
  const tPad = Math.max((tMax - tMin) * 0.05, DAY / 4);

  return (
    <div className="chart">
      <div className="chart-controls">
        <div className="segmented" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button key={r.label} type="button" className={range === r.days ? 'on' : ''} aria-pressed={range === r.days} onClick={() => setRange(r.days)}>
              {r.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-text" onClick={() => setAsTable((v) => !v)}>
          {asTable ? 'Show chart' : 'Show as table'}
        </button>
      </div>

      {asTable ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Reading ({unit})</th>
              <th>Zone</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.t}>
                <td>{formatDateTime(p.t)}</td>
                <td className="num">{formatValue(p.v)}</td>
                <td>{ZONE_LABEL[p.zone]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : points.length === 0 ? (
        <div className="empty">
          <p>No readings in this time range. Try "All".</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={points} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
              {bands(measurement, lo, hi).map((b) => (
                <ReferenceArea key={`${b.zone}-${b.y1}`} y1={b.y1} y2={b.y2} fill={`var(--band-${b.zone})`} fillOpacity={1} stroke="none" ifOverflow="hidden" />
              ))}
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="t" type="number" scale="time" domain={[tMin - tPad, tMax + tPad]} tickFormatter={(t: number) => formatDate(t)} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} stroke="var(--color-rule)" tickLine={false} minTickGap={40} />
              <YAxis domain={[lo, hi]} width={52} tickFormatter={(v: number) => formatValue(v)} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} stroke="var(--color-rule)" tickLine={false} allowDataOverflow />
              {usesBaseline(measurement) && lo < 0 && hi > 0 && (
                <ReferenceLine y={0} stroke="var(--color-muted)" strokeDasharray="4 4" label={{ value: 'Your baseline', position: 'insideTopLeft', fill: 'var(--color-muted)', fontSize: 12 }} />
              )}
              <Tooltip
                cursor={{ stroke: 'var(--color-muted)', strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  const p = active && payload && payload.length ? (payload[0].payload as Point) : null;
                  if (!p) return null;
                  return (
                    <div className="chart-tip">
                      <div className="muted small">{formatDateTime(p.t)}</div>
                      <div>
                        <span className="num strong">{formatValue(p.v)}</span> {unit}
                      </div>
                      <div className="small">
                        <span className={`dot zone-${p.zone}`} aria-hidden="true" /> {ZONE_LABEL[p.zone]}
                      </div>
                    </div>
                  );
                }}
              />
              <Line dataKey="v" type="monotone" stroke="var(--color-ink)" strokeWidth={2} dot={<Dot />} activeDot={{ r: 7, className: 'chart-active' }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <ul className="band-legend" aria-label="What the background colors mean">
            <li><span className="swatch band-green" /> Healthy range</li>
            <li><span className="swatch band-yellow" /> Watch</li>
            <li><span className="swatch band-red" /> Act now</li>
          </ul>
        </>
      )}
    </div>
  );
}
