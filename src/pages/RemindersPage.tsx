// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Reminders: upcoming measurements for the next day, week and month. Uses GET /users/digest, the same
// buckets the backend's daily notifications use. The backend's buckets nest (today is also in "week"),
// so each reminder is shown once, in its soonest group.
import { WhyPanel } from '../components/explain/WhyPanel';
import { ErrorState, Loading, PageHeader } from '../components/layout/AppShell';
import { MeasurementRow } from '../components/measurement/Parts';
import type { Reminder } from '../api/types';
import { GENERAL_EXPLAINER } from '../content/explainers';
import { useDashboard, useDigest } from '../hooks/queries';
import { toMillis } from '../lib/dates';

export function RemindersPage() {
  const dash = useDashboard();
  const digest = useDigest();

  if (dash.isLoading || digest.isLoading) return <Loading label="Loading your reminders…" />;
  if (dash.error || digest.error) return <ErrorState error={dash.error ?? digest.error} onRetry={() => { dash.refetch(); void digest.refetch(); }} />;

  const daily = digest.data?.daily ?? [];
  const weekly = digest.data?.weekly ?? [];
  const monthly = digest.data?.monthly ?? [];
  const ids = (list: Reminder[]) => new Set(list.map((r) => r.measurementId));
  const dailyIds = ids(daily);
  const weeklyIds = ids(weekly);
  const byDue = (list: Reminder[]) => [...list].sort((a, b) => toMillis(a.dueDate) - toMillis(b.dueDate));
  const groups = [
    { title: 'Today', hint: 'Due now or in the next 24 hours', items: byDue(daily), empty: 'Nothing due today. Nice work.' },
    { title: 'Later this week', hint: 'Due in the next 7 days', items: byDue(weekly.filter((r) => !dailyIds.has(r.measurementId))), empty: 'Nothing else due this week.' },
    { title: 'Later this month', hint: 'Due in the next 30 days', items: byDue(monthly.filter((r) => !weeklyIds.has(r.measurementId))), empty: 'Nothing else due this month.' },
  ];

  return (
    <div className="page narrow">
      <PageHeader title="Reminders" eyebrow="Upcoming measurements" back={{ to: '/', label: 'Home' }}>
        <p className="muted">Tap a measurement to see your trend and take it. You can change how often each one comes up on its own screen.</p>
      </PageHeader>
      {groups.map((group) => (
        <section key={group.title} className="card reminder-group" aria-label={group.title}>
          <div className="section-head">
            <h2>{group.title}</h2>
            <span className="muted small">
              {group.items.length} · {group.hint}
            </span>
          </div>
          {group.items.length === 0 ? (
            <p className="muted">{group.empty}</p>
          ) : (
            <div className="rows scroll">
              {group.items.map((r) => (
                <MeasurementRow key={r.measurementId} id={r.measurementId} measurement={dash.measurements[r.measurementId]} history={dash.histories[r.measurementId]} zone={dash.zones[r.measurementId] ?? 'none'} dueMs={toMillis(r.dueDate)} />
              ))}
            </div>
          )}
        </section>
      ))}
      <WhyPanel why={GENERAL_EXPLAINER.why} space={GENERAL_EXPLAINER.space} whyTitle="Why are these exams needed?" open={false} />
    </div>
  );
}
