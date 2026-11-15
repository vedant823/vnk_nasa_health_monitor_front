// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Home-screen engagement: mission readiness score, check-in streak, weekly milestone bar, badges.
import type { Badge } from '../../lib/gamification';
import { ZONE_LABEL, type Zone } from '../../lib/zones';
import { Icon, ScoreRing } from '../status/Status';

interface StripProps {
  readiness: number | null;
  zone: Zone;
  streak: number;
  week: { done: number; total: number };
  baseline: { done: number; total: number };
}

export function HomeStrip({ readiness, zone, streak, week, baseline }: StripProps) {
  const weekPct = week.total ? Math.round((week.done / week.total) * 100) : 0;
  return (
    <section className="strip" aria-label="Your mission readiness">
      <div className="card strip-card readiness">
        <ScoreRing score={readiness} zone={zone} size={104} />
        <div>
          <span className="eyebrow">Mission readiness</span>
          {readiness === null ? (
            <>
              <p className="strip-big">Start your baseline</p>
              <p className="muted small">
                {baseline.done} of {baseline.total} first readings done. Your score appears after your first scored reading.
              </p>
            </>
          ) : (
            <>
              <p className="strip-big">{ZONE_LABEL[zone]}</p>
              <p className="muted small">The average of your risk scores. One "act now" risk caps it at 25 so it is never hidden.</p>
            </>
          )}
        </div>
      </div>
      <div className="card strip-card">
        <span className="strip-icon flame"><Icon name="flame" size={26} /></span>
        <div>
          <span className="eyebrow">Check-in streak</span>
          <p className="strip-big">
            <span className="num">{streak}</span> day{streak === 1 ? '' : 's'}
          </p>
          <p className="muted small">{streak === 0 ? 'Log any measurement today to start a streak.' : 'Log at least one measurement a day to keep it going.'}</p>
        </div>
      </div>
      <div className="card strip-card milestone">
        <div className="milestone-head">
          <span className="eyebrow">Wellness milestone: this week</span>
          <span className="num">
            {week.done} of {week.total}
          </span>
        </div>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={week.total} aria-valuenow={week.done} aria-label="Measurements taken this week">
          <div className="bar-fill" style={{ width: `${weekPct}%` }} />
        </div>
        <p className="muted small">
          {week.done === week.total && week.total > 0 ? 'Every check done this week. Great work.' : 'Checks with a reading in the last 7 days. Fill the bar to hit this week\'s milestone.'}
        </p>
      </div>
    </section>
  );
}

export function BadgeShelf({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <section className="card" aria-label="Badges">
      <div className="section-head">
        <h2>Badges</h2>
        <span className="muted small">
          {earned} of {badges.length} earned
        </span>
      </div>
      <ul className="badges">
        {badges.map((badge) => (
          <li key={badge.id} className={`badge${badge.earned ? ' earned' : ''}`}>
            <span className="badge-icon"><Icon name={badge.earned ? 'badge' : 'lock'} size={22} /></span>
            <span className="badge-name">{badge.name}</span>
            <span className="muted small">{badge.earned ? 'Earned' : badge.how}</span>
            {!badge.earned && (
              <span className="badge-progress" role="progressbar" aria-label={`${badge.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(badge.progress * 100)}>
                <span style={{ width: `${Math.round(badge.progress * 100)}%` }} />
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
