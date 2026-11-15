// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Extreme-reading alerts: the hook that keeps them in step with the readings, the red card that
// warns the crew member and counts down, and the Crew Medical Officer packet.
// SIMULATED: nothing is sent off the device. See lib/groundAlerts.ts.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useEnvironment } from '../../auth/EnvironmentContext';
import type { Dashboard } from '../../hooks/queries';
import { formatGmt } from '../../lib/changeLog';
import { toMillis } from '../../lib/dates';
import { alertStatus, buildPacket, countdownText, loadAlerts, notifyNow, syncAlerts, withdrawnAfterNotice, type GroundAlert } from '../../lib/groundAlerts';
import { latestSet } from '../../lib/zones';
import { Icon } from '../status/Status';

export interface GroundAlertState {
  /** Every alert on record, newest first. */
  alerts: GroundAlert[];
  /** Alerts that still stand: not withdrawn, and about the measurement's latest reading. */
  active: GroundAlert[];
  now: number;
  packetFor: (alert: GroundAlert) => string;
  sendNow: (alert: GroundAlert) => void;
}

/** Keeps the alerts in step with the readings and ticks once a second while a countdown runs. */
export function useGroundAlerts(dash: Dashboard, enabled = true): GroundAlertState {
  const { username } = useAuth();
  const { environment } = useEnvironment();
  // Alerts are kept on the crew member's own device, so an officer looking at someone else gets none.
  const [alerts, setAlerts] = useState<GroundAlert[]>(() => (enabled ? loadAlerts(username) : []));
  const [now, setNow] = useState(() => Date.now());

  const ready = enabled && !dash.isLoading && !dash.error;
  // The dashboard builds new objects on every render, so compare readings by a short signature.
  const signature = dash.measurementIds
    .map((id) => {
      const history = dash.histories[id] ?? [];
      const latest = latestSet(history);
      return `${id}:${history.length}:${latest ? toMillis(latest.timestamp) : 0}:${dash.measurements[id]?.dangerousLow ?? ''}:${dash.measurements[id]?.dangerousHigh ?? ''}`;
    })
    .join('|');
  useEffect(() => {
    if (!ready || !username) return;
    setAlerts(syncAlerts(username, dash.measurements, dash.histories));
    setNow(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, username, signature]);

  const anyPending = alerts.some((a) => alertStatus(a, now) === 'pending');
  useEffect(() => {
    if (!anyPending) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [anyPending]);

  const active = alerts.filter((a) => {
    if (a.withdrawnAt) return false;
    const latest = latestSet(dash.histories[a.measurementId]);
    return latest !== null && `${a.measurementId}@${toMillis(latest.timestamp)}` === a.key;
  });

  const packetFor = (alert: GroundAlert) =>
    buildPacket(alert, {
      username,
      environment,
      measurement: dash.measurements[alert.measurementId],
      history: dash.histories[alert.measurementId],
      risks: dash.risks.filter((r) => r.factor.measurementIds.includes(alert.measurementId)).map((r) => ({ name: r.factor.name, score: r.zone === 'none' ? null : r.score })),
      now,
    });
  const sendNow = useCallback(
    (alert: GroundAlert) => {
      setAlerts(notifyNow(username, alert.key));
      setNow(Date.now());
    },
    [username],
  );
  return { alerts, active, now, packetFor, sendNow };
}

/** The packet text with a copy button. */
export function PacketText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="report">
      <textarea readOnly value={text} rows={14} aria-label="Crew Medical Officer packet text" />
      <button type="button" className="btn btn-text no-print" onClick={() => void navigator.clipboard?.writeText(text).then(() => setCopied(true))}>
        {copied ? 'Copied' : 'Copy packet text'}
      </button>
    </div>
  );
}

interface CardProps {
  alert: GroundAlert;
  now: number;
  packet: string;
  onSendNow: () => void;
  /** Inside the result sheet the Undo button is right below, so the card points to it. */
  inResultSheet?: boolean;
}

/** Red warning shown to the crew member while an extreme reading stands. */
export function ExtremeAlertCard({ alert, now, packet, onSendNow, inResultSheet }: CardProps) {
  const [open, setOpen] = useState(false);
  const status = alertStatus(alert, now);
  const remaining = Date.parse(alert.notifyAt) - now;
  return (
    <section className="card extreme-alert zone-emergency" role="alert" aria-label="Extreme reading">
      <h3>
        <Icon name="siren" /> {alert.measurementName} is far outside the safe range
      </h3>
      <p>
        Your reading of <strong>{alert.valueText}</strong> is {alert.limitText}. A packet for the Crew Medical Officer has been prepared automatically.
      </p>
      {status === 'pending' ? (
        <p className="extreme-countdown" role="status">
          The ground crew will be notified in <strong className="num">{countdownText(remaining)}</strong> unless you undo this reading.
        </p>
      ) : (
        <p className="extreme-countdown" role="status">
          The ground crew was notified at <strong className="num">{formatGmt(alert.notifyAt)}</strong>. Go to your Crew Medical Officer now.
        </p>
      )}
      <p>
        <strong>Was it a mistake?</strong>{' '}
        {inResultSheet
          ? 'Press "Undo this entry" below and the alert is withdrawn.'
          : status === 'pending'
            ? 'Undo or correct the reading and the alert is withdrawn.'
            : 'Undo or correct the reading and the ground crew is told it was withdrawn.'}
      </p>
      <div className="dialog-actions">
        {!inResultSheet && (
          <Link className="btn btn-filled" to={`/measurements/${encodeURIComponent(alert.measurementId)}`}>
            It was a mistake: fix the reading
          </Link>
        )}
        <button type="button" className="btn btn-outline" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide the packet' : 'View the packet'}
        </button>
        {status === 'pending' && (
          <button type="button" className="btn btn-text" onClick={onSendNow}>
            It is real: notify now
          </button>
        )}
      </div>
      {open && <PacketText text={packet} />}
      <p className="muted small">Simulated in this prototype: nothing is sent off this device. Tell your Crew Medical Officer in person.</p>
    </section>
  );
}

/** One line per alert, for the Crew Medical Officer summary. */
export function alertStatusText(alert: GroundAlert, now: number): string {
  const status = alertStatus(alert, now);
  if (status === 'pending') return `Ground crew will be notified at ${formatGmt(alert.notifyAt)} unless the reading is undone`;
  if (status === 'notified') return `Ground crew notified ${formatGmt(alert.notifyAt)}`;
  return `Withdrawn ${formatGmt(alert.withdrawnAt)}: reading undone or corrected ${withdrawnAfterNotice(alert) ? 'after the ground crew was notified' : 'before the ground crew was notified'}`;
}
